from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time

try:
    options = Options()
    options.add_argument("--headless")
    options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
    driver = webdriver.Chrome(options=options)
    driver.get("http://localhost:5173")
    time.sleep(3)
    
    logs = driver.get_log('browser')
    for entry in logs:
        print(f"[{entry['level']}] {entry['message']}")
        
    # Check if elements are present
    print("mount-topic-practice:", driver.execute_script("return !!document.getElementById('mount-topic-practice');"))
    print("practice-tab-1:", driver.execute_script("return !!document.getElementById('practice-tab-1');"))
    
    driver.quit()
except Exception as e:
    print(e)
