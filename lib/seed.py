import json
import re
from typing import Dict, List, Any

def parse_cutoff_data_to_json(text_data: str) -> List[Dict[str, Any]]:
    """
    Convert extracted cutoff list text data into structured JSON format
    """
    colleges = []
    
    # Regular expressions for parsing
    college_pattern = r'(\d{4})\s+([^(]+)\s*\([^)]+\)'
    choice_pattern = r'Choice Code\s*:\s*(\d+)'
    course_pattern = r'Course Name\s*:\s*([^\n]+)'
    category_pattern = r'([A-Z]+(?:-[A-Z]+)?)\s+Stage-([IVX]+)\s+(\d+)\s*\(([0-9.]+)%\)'
    
    lines = text_data.split('\n')
    current_college = None
    current_course = None
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Check for college information
        college_match = re.search(college_pattern, line)
        if college_match:
            college_code = college_match.group(1)
            college_name = college_match.group(2).strip()
            
            current_college = {
                "collegeName": college_name,
                "collegeCode": college_code,
                "courses": []
            }
            colleges.append(current_college)
        
        # Check for choice code
        elif "Choice Code" in line and current_college:
            choice_match = re.search(choice_pattern, line)
            if choice_match:
                choice_code = choice_match.group(1)
                
                # Look for course name in next few lines
                for j in range(i+1, min(i+5, len(lines))):
                    course_line = lines[j].strip()
                    if "Course Name" in course_line:
                        course_match = re.search(course_pattern, course_line)
                        if course_match:
                            course_name = course_match.group(1).strip()
                            
                            current_course = {
                                "courseName": course_name,
                                "choiceCode": choice_code,
                                "capRound": "CAP Round I",
                                "stages": []
                            }
                            current_college["courses"].append(current_course)
                            break
        
        # Parse category data
        elif current_course and (re.search(r'Stage-[IVX]+', line) or 
                                any(cat in line for cat in ['GOPEN', 'GSC', 'GST', 'GOBC', 'LOPEN', 'LSC', 'EWS'])):
            
            # Extract stage information
            stage_match = re.search(r'Stage-([IVX]+)', line)
            stage_name = f"Stage-{stage_match.group(1)}" if stage_match else "Stage-I"
            
            # Find existing stage or create new one
            stage_obj = None
            for stage in current_course["stages"]:
                if stage["stage"] == stage_name:
                    stage_obj = stage
                    break
            
            if not stage_obj:
                stage_obj = {
                    "stage": stage_name,
                    "categories": {}
                }
                current_course["stages"].append(stage_obj)
            
            # Parse category data from current and next lines
            category_lines = [line]
            for j in range(i+1, min(i+10, len(lines))):
                next_line = lines[j].strip()
                if next_line and not re.search(college_pattern, next_line) and "Choice Code" not in next_line:
                    category_lines.append(next_line)
                else:
                    break
            
            # Extract category data
            full_text = ' '.join(category_lines)
            categories = re.findall(r'([A-Z]+(?:-[A-Z]+)?)\s+(\d+)\s*\(([0-9.]+)%\)', full_text)
            
            for cat_code, rank, percent in categories:
                if cat_code in ['GOPEN', 'GSC', 'GST', 'GNTA', 'GNTB', 'GNTC', 'GNTD', 
                               'GOBC', 'GSEBC', 'LOPEN', 'LSC', 'LST', 'LNTA', 'LNTB', 
                               'LNTC', 'LNTD', 'LOBC', 'LSEBC', 'EWS', 'PWD-O', 'DEF-O']:
                    stage_obj["categories"][cat_code] = {
                        "rank": int(rank),
                        "percent": float(percent)
                    }
        
        i += 1
    
    return colleges

def save_to_json(colleges: List[Dict[str, Any]], filename: str = "cutoff_data.json"):
    """
    Save the parsed data to a JSON file
    """
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(colleges, f, indent=2, ensure_ascii=False)
    
    print(f"Data saved to {filename}")

# Example usage
def main():
    # You would need to extract text from PDF first
    # Using libraries like PyPDF2, pdfplumber, or similar
    
    # Example of how to use:
    sample_text = """
    1002 Government College of Engineering, Amravati (Government Autonomous)
    Choice Code : 100219110
    Course Name : Civil Engineering
    GOPEN GSC GSEBC LOPEN LST LOBC EWS
    Stage-I 1432 (91.37%) 2087 (90.26%) 2895 (89.21%) 1270 (91.68%) 7466 (85.05%) 1376 (91.48%) 6296 (85.95%)
    """
    
    # Parse the data
    colleges_data = parse_cutoff_data_to_json(sample_text)
    
    # Save to JSON file
    save_to_json(colleges_data)
    
    # Print sample output
    print("Sample parsed data:")
    print(json.dumps(colleges_data[:1], indent=2))

if __name__ == "__main__":
    main()
