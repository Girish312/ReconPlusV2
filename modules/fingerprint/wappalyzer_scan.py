from Wappalyzer import Wappalyzer, WebPage

def detect_technology(url):

    wappalyzer = Wappalyzer.latest()

    webpage = WebPage.new_from_url(url)

    technologies = wappalyzer.analyze(webpage)

    return technologies