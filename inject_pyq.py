import json

with open("output_bci_1.json", "r", encoding="utf-8") as f:
    bci_i_data = f.read()

# Fallback tests format
js_content = f"""// Overwritten mock test bank targeting the Rajasthan RSSB Computer Instructor (BCI) Exam.
// Contains real questions extracted from the 2022 Papers.
export const fallbackTests = {{
  BCI_I: {bci_i_data},
  BCI_II: []
}};
"""

with open("src/data/fallbackTests.js", "w", encoding="utf-8") as f:
    f.write(js_content)
print("Successfully injected 100 questions into src/data/fallbackTests.js!")
