import json
import os
import re
import threading
import zipfile
from typing import Any, Dict, List, Optional


class AssistantEngine:
    def __init__(self) -> None:
        self._initialized = False
        self._loading = False
        self._generator = None
        self._load_error = None
        self._model_label = "fallback"
        self._init_lock = threading.Lock()

    def _tokenize_text(self, value: str) -> List[str]:
        return [token for token in re.split(r"[^a-z0-9]+", (value or "").lower()) if token]

    def _find_matching_vulnerability(self, question: str, report: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        vulns = report.get("web_vulnerabilities", []) or []
        if not vulns:
            return None

        lower_question = (question or "").lower()

        # Exact/substring match first.
        for vuln in vulns:
            name = (vuln.get("vulnerability") or "").strip()
            if name and name.lower() in lower_question:
                return vuln

        # Token overlap fallback for partial queries (for example, "terrapin ssh detection").
        question_tokens = set(self._tokenize_text(lower_question))
        if not question_tokens:
            return None

        best_score = 0
        best_match = None

        for vuln in vulns:
            name = (vuln.get("vulnerability") or "").strip()
            if not name:
                continue

            vuln_tokens = {token for token in self._tokenize_text(name) if len(token) >= 4}
            if not vuln_tokens:
                continue

            score = len(question_tokens.intersection(vuln_tokens))
            if score > best_score:
                best_score = score
                best_match = vuln

        return best_match if best_score >= 2 else None

    def _format_vulnerability_detail(self, vuln: Dict[str, Any]) -> str:
        name = vuln.get("vulnerability", "Unknown vulnerability")
        severity = (vuln.get("severity") or "INFO").upper()
        host = vuln.get("host") or vuln.get("target") or "the scanned host"
        remedy = vuln.get("remedy") or "No remediation guidance was provided in the latest report."

        return (
            f"{name} was detected on {host} with {severity} severity. "
            f"Recommended remediation: {remedy}"
        )

    def _configure_generation_defaults(self) -> None:
        if not self._generator:
            return

        model = getattr(self._generator, "model", None)
        if not model:
            return

        gen_cfg = getattr(model, "generation_config", None)
        if gen_cfg and hasattr(gen_cfg, "max_length"):
            gen_cfg.max_length = None

        model_cfg = getattr(model, "config", None)
        if model_cfg and hasattr(model_cfg, "max_length"):
            model_cfg.max_length = None

    def _find_model_dir(self, root_dir: str) -> Optional[str]:
        candidates = []

        def score_dir(path: str) -> int:
            files = set(os.listdir(path))
            # Strongest candidate: complete model/tokenizer bundle.
            if "config.json" in files and (
                "tokenizer.json" in files or "tokenizer.model" in files
            ):
                return 3
            # LoRA adapter package.
            if "adapter_config.json" in files and "adapter_model.safetensors" in files:
                return 2
            # Tokenizer-only folder.
            if "tokenizer.json" in files or "tokenizer.model" in files:
                return 1
            return 0

        for current_root, dirs, _ in os.walk(root_dir):
            try:
                score = score_dir(current_root)
            except Exception:
                continue
            if score > 0:
                candidates.append((score, current_root))

        if not candidates:
            return None

        candidates.sort(key=lambda item: item[0], reverse=True)
        return candidates[0][1]

    def _extract_zip_if_needed(self, zip_path: str, target_dir: str) -> str:
        os.makedirs(target_dir, exist_ok=True)

        marker = os.path.join(target_dir, ".extracted")
        if os.path.exists(marker):
            return target_dir

        with zipfile.ZipFile(zip_path, "r") as archive:
            archive.extractall(target_dir)

        with open(marker, "w", encoding="utf-8") as marker_file:
            marker_file.write("ok")

        return target_dir

    def _resolve_model_dir(self) -> Optional[str]:
        model_dir = os.getenv("ASSISTANT_MODEL_DIR", "").strip()
        model_zip = os.getenv("ASSISTANT_MODEL_ZIP", "").strip()

        if model_dir and os.path.isdir(model_dir):
            return self._find_model_dir(model_dir) or model_dir

        if model_zip and os.path.isfile(model_zip):
            extracted_dir = os.path.join("output", "assistant_model")
            resolved = self._extract_zip_if_needed(model_zip, extracted_dir)
            return self._find_model_dir(resolved) or resolved

        return None

    def _load_full_model(self, model_dir: str) -> None:
        from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

        tokenizer = AutoTokenizer.from_pretrained(model_dir, local_files_only=True)
        model = AutoModelForCausalLM.from_pretrained(model_dir, local_files_only=True)
        self._generator = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            device=-1,
        )
        self._configure_generation_defaults()
        self._model_label = os.path.basename(model_dir.rstrip("/\\")) or "custom-model"

    def _load_lora_model(self, adapter_dir: str) -> None:
        base_model = os.getenv("ASSISTANT_BASE_MODEL", "").strip()
        if not base_model:
            self._load_error = (
                "LoRA adapter detected. Set ASSISTANT_BASE_MODEL to a compatible "
                "base model path or Hugging Face model id."
            )
            return

        try:
            from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
            from peft import PeftModel
        except Exception as exc:
            self._load_error = (
                "LoRA loading requires extra packages. Install with: "
                "pip install peft transformers torch. "
                f"Details: {exc}"
            )
            return

        # Prefer adapter tokenizer if present, else fallback to base model tokenizer.
        tokenizer_source = adapter_dir
        if not (
            os.path.exists(os.path.join(adapter_dir, "tokenizer.json"))
            or os.path.exists(os.path.join(adapter_dir, "tokenizer.model"))
        ):
            tokenizer_source = base_model

        tokenizer = AutoTokenizer.from_pretrained(tokenizer_source, local_files_only=False)
        base = AutoModelForCausalLM.from_pretrained(base_model, local_files_only=False)
        model = PeftModel.from_pretrained(base, adapter_dir, local_files_only=True)

        self._generator = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            device=-1,
        )
        self._configure_generation_defaults()
        adapter_name = os.path.basename(adapter_dir.rstrip("/\\")) or "lora-adapter"
        self._model_label = f"{adapter_name} (LoRA)"

    def _init_model(self) -> None:
        if self._initialized:
            return

        with self._init_lock:
            if self._initialized:
                return

            self._initialized = True
            self._loading = True

            model_dir = self._resolve_model_dir()
            if not model_dir:
                self._load_error = (
                    "Model not configured. Set ASSISTANT_MODEL_DIR or ASSISTANT_MODEL_ZIP "
                    "to enable fine-tuned responses."
                )
                self._loading = False
                return

            try:
                adapter_config = os.path.join(model_dir, "adapter_config.json")
                if os.path.exists(adapter_config):
                    self._load_lora_model(model_dir)
                else:
                    self._load_full_model(model_dir)
            except Exception as exc:
                self._load_error = str(exc)
                self._generator = None
            finally:
                self._loading = False

    def _top_vulns(self, report: Dict[str, Any], limit: int = 3) -> List[str]:
        vulns = report.get("web_vulnerabilities", []) or []
        lines = []
        for vuln in vulns[:limit]:
            lines.append(
                f"- {vuln.get('vulnerability', 'Unknown')} ({vuln.get('severity', 'INFO')})"
            )
        return lines

    def _build_context(self, report: Dict[str, Any]) -> str:
        risk = report.get("risk_summary", {}) or {}
        score = report.get("overall_numeric_score", 0)
        prob = report.get("compromise_probability_percent", 0)
        recommendations = report.get("recommendations", []) or []

        rec_lines = []
        for rec in recommendations[:3]:
            rec_lines.append(
                f"- [{rec.get('priority', 'INFO')}] {rec.get('issue', 'Issue')}: {rec.get('action', 'No action')}"
            )

        context_lines = [
            f"Overall risk score: {score}/10",
            f"Compromise probability: {prob}%",
            (
                "Risk summary: "
                f"Critical={risk.get('CRITICAL', 0)}, "
                f"High={risk.get('HIGH', 0)}, "
                f"Medium={risk.get('MEDIUM', 0)}, "
                f"Low={risk.get('LOW', 0)}"
            ),
            "Top vulnerabilities:",
            *self._top_vulns(report),
            "Top recommendations:",
            *rec_lines,
        ]

        return "\n".join(context_lines)

    def _fallback_answer(self, question: str, report: Dict[str, Any]) -> str:
        lower = (question or "").lower()

        if lower.strip() in {"hi", "hello", "hey", "hii", "yo"}:
            return "Hi. I can help with your latest scan risk score, findings, and remediation actions."

        if "risk" in lower or "score" in lower:
            score = report.get("overall_numeric_score", 0)
            prob = report.get("compromise_probability_percent", 0)
            return (
                f"Current overall risk is {score}/10 with an estimated compromise "
                f"probability of {prob}%."
            )

        if "vuln" in lower or "issue" in lower:
            vulns = report.get("web_vulnerabilities", []) or []
            if not vulns:
                return "No web vulnerabilities are available in the latest report."
            names = [v.get("vulnerability", "Unknown") for v in vulns[:3]]
            return "Top findings are: " + "; ".join(names) + "."

        if "recommend" in lower or "fix" in lower or "remed" in lower:
            recs = report.get("recommendations", []) or []
            if not recs:
                return "No remediation recommendations are available in the latest report."
            first = recs[0]
            return (
                f"Top action: {first.get('issue', 'Issue')} -> "
                f"{first.get('action', 'No action provided')}."
            )

        return (
            "I can help explain your latest scan results. Ask about risk score, "
            "top vulnerabilities, or remediation actions."
        )

    def _rule_based_answer(self, question: str, report: Dict[str, Any]) -> Optional[str]:
        lower = (question or "").lower()

        specific_vuln = self._find_matching_vulnerability(lower, report)
        if specific_vuln:
            return self._format_vulnerability_detail(specific_vuln)

        if "risk" in lower or "score" in lower:
            score = report.get("overall_numeric_score", 0)
            prob = report.get("compromise_probability_percent", 0)
            risk = report.get("risk_summary", {}) or {}
            return (
                f"Overall risk is {score}/10 with compromise probability {prob}%. "
                f"Breakdown: Critical {risk.get('CRITICAL', 0)}, High {risk.get('HIGH', 0)}, "
                f"Medium {risk.get('MEDIUM', 0)}, Low {risk.get('LOW', 0)}."
            )

        if any(
            token in lower
            for token in ["recommend", "fix", "remed", "reduce", "lower", "mitigat", "improve"]
        ):
            recs = report.get("recommendations", []) or []
            if not recs:
                return "No remediation recommendations are available in the latest report."

            actions = []
            for rec in recs[:5]:
                issue = rec.get("issue", "Issue")
                action = rec.get("action", "No action provided")
                actions.append(f"{issue}: {action}")

            return "To reduce risk, prioritize: " + " | ".join(actions) + "."

        if any(token in lower for token in ["vuln", "issue", "finding", "top"]):
            vulns = report.get("web_vulnerabilities", []) or []
            if not vulns:
                return "No web vulnerabilities are available in the latest report."

            top = []
            for vuln in vulns[:3]:
                name = vuln.get("vulnerability", "Unknown")
                sev = vuln.get("severity", "INFO")
                top.append(f"{name} ({sev})")
            return "Top findings: " + "; ".join(top) + "."

        if any(token in lower for token in ["what is", "explain", "details", "about"]):
            specific_vuln = self._find_matching_vulnerability(lower, report)
            if specific_vuln:
                return self._format_vulnerability_detail(specific_vuln)

        return None

    def _postprocess_generated_answer(self, prompt: str, generated: str) -> str:
        text = (generated or "").strip()

        if text.startswith(prompt):
            text = text[len(prompt):].strip()

        stop_markers = ["User question:", "Scan context:", "Assistant answer:"]
        for marker in stop_markers:
            if marker in text:
                text = text.split(marker, 1)[0].strip()

        text = " ".join(text.split())
        if not text:
            return ""

        if len(text) > 550:
            text = text[:550].rsplit(" ", 1)[0].strip()

        if text[-1] not in ".!?":
            sentence_end_positions = [text.rfind("."), text.rfind("!"), text.rfind("?")]
            last_end = max(sentence_end_positions)
            if last_end > 20:
                text = text[: last_end + 1].strip()
            else:
                text = f"{text}."

        return text

    def ask(self, question: str, report: Dict[str, Any]) -> Dict[str, Any]:
        self._init_model()

        clean_question = (question or "").strip()
        if not clean_question:
            return {
                "answer": "Please type a question for the assistant.",
                "source": "fallback",
                "model": self._model_label,
                "model_error": self._load_error,
            }

        # Keep simple greetings snappy and clean.
        if clean_question.lower() in {"hi", "hello", "hey", "hii", "yo"}:
            return {
                "answer": "Hi. Ask me about risk score, top vulnerabilities, or remediation from your latest scan.",
                "source": "assistant-rule",
                "model": self._model_label,
                "model_error": self._load_error,
            }

        rule_answer = self._rule_based_answer(clean_question, report)
        if rule_answer:
            return {
                "answer": rule_answer,
                "source": "assistant-rule",
                "model": self._model_label,
                "model_error": self._load_error,
            }

        if self._loading:
            return {
                "answer": (
                    "Model is still loading in the backend (first run can take time while "
                    "base model downloads). Please try again in a moment."
                ),
                "source": "loading",
                "model": self._model_label,
                "model_error": self._load_error,
            }

        if not self._generator:
            return {
                "answer": self._fallback_answer(clean_question, report),
                "source": "fallback",
                "model": self._model_label,
                "model_error": self._load_error,
            }

        context = self._build_context(report)
        prompt = (
            "You are ReconPlus Assistant. Answer briefly and clearly based on the scan context.\n"
            "Use 2-3 short sentences unless user asks for details.\n"
            "If data is not in context, say you do not see it in the latest report.\n\n"
            f"Scan context:\n{context}\n\n"
            f"User question: {clean_question}\n"
            "Assistant answer:"
        )

        try:
            output = self._generator(
                prompt,
                max_new_tokens=120,
                do_sample=True,
                top_p=0.9,
                temperature=0.7,
                num_return_sequences=1,
            )
            text = self._postprocess_generated_answer(
                prompt,
                output[0].get("generated_text", ""),
            )
            if not text:
                text = self._fallback_answer(clean_question, report)
            return {
                "answer": text,
                "source": "model",
                "model": self._model_label,
                "model_error": self._load_error,
            }
        except Exception as exc:
            return {
                "answer": self._fallback_answer(clean_question, report),
                "source": "fallback",
                "model": self._model_label,
                "model_error": str(exc),
            }

    def status(self) -> Dict[str, Any]:
        self._init_model()

        if self._loading:
            state = "loading"
        elif self._generator is not None:
            state = "ready"
        else:
            state = "fallback"

        return {
            "state": state,
            "model": self._model_label,
            "model_error": self._load_error,
        }


assistant_engine = AssistantEngine()
