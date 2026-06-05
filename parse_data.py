import pandas as pd
import json
import re
import difflib

def clean_text(text):
    if pd.isna(text):
        return ""
    return str(text).strip()

def normalize_category_and_tfw(cat):
    c = clean_text(cat).upper()
    
    is_tfw = False
    if 'TFW' in c or 'TUITION' in c:
        is_tfw = True
        return 'GENERAL', is_tfw
        
    if 'OPEN' in c or 'GENERAL' in c or c == 'OP' or c == 'GEN':
        return 'GENERAL', is_tfw
    if 'OBC' in c and 'A' in c:
        return 'OBC-A', is_tfw
    if 'OBC' in c and 'B' in c:
        return 'OBC-B', is_tfw
    if 'SC' in c:
        return 'SC', is_tfw
    if 'ST' in c:
        return 'ST', is_tfw
    if 'EWS' in c:
        return 'EWS', is_tfw
        
    return 'GENERAL', is_tfw

def normalize_quota(quota):
    q = clean_text(quota).title()
    if 'All India' in q:
        return 'All India'
    if 'Home State' in q:
        return 'Home State'
    return 'Home State'  # Default fallback if unknown

MASTER_PROGRAMS = [
    "Agricultural Engineering",
    "Apparel & Production Management",
    "Applied Electronics and Instrumentation Engineering",
    "Architecture",
    "Architectural Engineering",
    "Artificial Intelligence",
    "Artificial Intelligence and Data Science",
    "Artificial Intelligence and Machine Learning",
    "Automobile Engineering",
    "B.Pharm / Pharmaceutical Technology",
    "Biomedical Engineering",
    "Biotechnology",
    "Ceramic Engineering and Technology",
    "Chemical Engineering",
    "Chemical Technology",
    "Civil and Environmental Engineering",
    "Civil Engineering",
    "Cloud Computing",
    "Computer Science and Applied Mathematics",
    "Computer Science and Business System",
    "Computer Science and Design",
    "Computer Science and Engineering",
    "Computer Science and Engineering (Artificial Intelligence)",
    "Computer Science and Engineering (Artificial Intelligence and Machine Learning)",
    "Computer Science and Engineering (Cyber Security)",
    "Computer Science and Engineering (Data Science)",
    "Computer Science and Engineering (Internet of Things)",
    "Computer Science and Engineering (Internet of Things and Cyber Security Including Blockchain Technology)",
    "Computer Science and Engineering (Robotics and Artificial Intelligence)",
    "Computer Science and Information Technology",
    "Computer Science and Technology",
    "Construction Engineering",
    "Dairy Technology",
    "Data Science",
    "Electrical and Computer Engineering",
    "Electrical and Electronics Engineering",
    "Electrical Engineering",
    "Electronics and Communication Engineering",
    "Electronics and Computer Science",
    "Electronics and Instrumentation Engineering",
    "Electronics and Telecommunication Engineering",
    "Electronics Engineering (VLSI Design and Technology)",
    "Food Technology",
    "Food Technology and Biochemical Engineering",
    "Information Technology",
    "Instrumentation and Electronics",
    "Instrumentation Engineering",
    "Jute and Fibre Technology",
    "Leather Technology",
    "Mechanical Engineering",
    "Mechatronics Engineering",
    "Metallurgical and Materials Engineering",
    "Metallurgical Engineering",
    "Mining Engineering",
    "Optics and Optoelectronics",
    "Polymer Science and Technology",
    "Power Engineering",
    "Printing Engineering",
    "Production Engineering",
    "Robotics and Artificial Intelligence",
    "Robotics and Automation Engineering",
    "Semiconductor Technology",
    "Textile Technology",
    "5G",
    "Virtual Reality (AR/VR)",
    "Augmented Reality (AR)"
]

def normalize_program(prog):
    p = clean_text(prog)
    is_tfw_prog = False
    
    # Extract TFW from program string
    p_upper = p.upper()
    if '(TFW)' in p_upper or ' TFW' in p_upper or 'TUITION FEE WAIVER' in p_upper:
        is_tfw_prog = True
        p_upper = p_upper.replace('(TFW)', '').replace(' TFW', '').replace('TUITION FEE WAIVER', '')
        p = p_upper.strip(' -()')
        
    p_and = p.replace('&', 'and')
    c_raw = clean_for_match(p_and)
    
    lookup_map = {clean_for_match(k): k for k in MASTER_PROGRAMS}
    
    if c_raw in lookup_map:
        return lookup_map[c_raw], is_tfw_prog
        
    import difflib
    matches = difflib.get_close_matches(c_raw, lookup_map.keys(), n=1, cutoff=0.7)
    if matches:
        return lookup_map[matches[0]], is_tfw_prog
        
    for clean_k, original_k in lookup_map.items():
        if clean_k in c_raw or c_raw in clean_k:
            return original_k, is_tfw_prog
            
    return p.title(), is_tfw_prog



def normalize_round(r):
    r = clean_text(r).upper()
    if '1' in r:
        return 'Round 1'
    if '2' in r:
        return 'Round 2'
    if 'MOP' in r or '3' in r:
        return None
    return 'Round 1'

DISTRICT_MAPPING = {
    'RCC Institute of Information Technology, Kolkata': 'Kolkata',
    'Swami Vivekananda University': 'North 24 Parganas',
    'B.P. Poddar Institute of Management & Technology, Kolkata': 'Kolkata',
    'Heritage Institute of Technology, Kolkata': 'Kolkata',
    'Hooghly Engineering & Technology College, Hooghly': 'Hooghly',
    'Narula Institute of Technology, Agarpara, Kolkata': 'North 24 Parganas',
    'Academy of Technology, Adisaptagram, Hooghly': 'Hooghly',
    'Swami Vivekananda Institute of Science & Technology, Sonarpur': 'South 24 Parganas',
    'Jadavpur University': 'Kolkata',
    'Regent Education and Research Foundation, Barasat, Kolkata': 'North 24 Parganas',
    'Institute of Science and Technology, Paschim Medinipur': 'Paschim Medinipur',
    'West Bengal University of Animal & Fishery Sciences': 'Kolkata',
    'Haldia Institute of Technology, Haldia, Purba Medinipur': 'Purba Medinipur',
    'Bidhan Chandra Krishi Viswavidyalaya, Mohanpur, Nadia': 'Nadia',
    'University of Calcutta': 'Kolkata',
    'Faculty of Technology, Uttar Banga Krishi Viswavidyalaya': 'Cooch Behar',
    'JIS College of Engineering, Kalyani, Nadia': 'Nadia',
    'Techno Main Salt Lake, Sector V, Salt Lake': 'Kolkata',
    'Netaji Subhas Engineering College, Garia, Kolkata': 'Kolkata',
    'Ghani Khan Choudhury Institute of Engineering & Technology, Malda': 'Malda',
    'Global Institute of Management and Technology, Krishnanagar, Nadia': 'Nadia',
    'University Institute of Technology, Burdwan University': 'Purba Bardhaman',
    'Darjeeling Hill Institute of Technology and Management': 'Darjeeling',
    'Adamas University, Barasat': 'North 24 Parganas',
    'Ramkrishna Mahato Government Engineering College, Purulia': 'Purulia',
    'Government College of Engineering & Textile Technology, Berhampore': 'Murshidabad',
    'Alipurduar Government Engineering and Management College': 'Alipurduar',
    'Techno India University, Salt Lake': 'Kolkata',
    'Kalyani Government Engineering College, Kalyani, Nadia': 'Nadia',
    'MCKV Institute of Engineering, Liluah, Howrah': 'Howrah',
    'Dr. Sudhir Chandra Sur Institute of Technology and Sports Complex, Dum Dum': 'North 24 Parganas',
    'Seacom Engineering College, Sankrail, Howrah': 'Howrah',
    'Bankura Unnayani Institute of Engineering, Bankura': 'Bankura',
    'Kazi Nazrul University, Asansol': 'Paschim Bardhaman',
    'Meghnad Saha Institute of Technology, Kolkata': 'Kolkata',
    'Techno International New Town, Rajarhat': 'North 24 Parganas',
    'Bengal College of Engineering & Technology, Durgapur': 'Paschim Bardhaman',
    'Siliguri Institute of Technology, Siliguri': 'Darjeeling',
    'Cooch Behar Government Engineering College, Cooch Behar': 'Cooch Behar',
    'Bengal School of Technology, Sugandha, Hooghly': 'Hooghly',
    'P.G. Institute of Medical Sciences, Chandrakona': 'Paschim Medinipur',
    'Dr. B. C. Roy Engineering College, Durgapur': 'Paschim Bardhaman',
    'Abacus Institute of Engineering & Management, Mogra, Hooghly': 'Hooghly',
    'Asansol Engineering College, Asansol': 'Paschim Bardhaman',
    'Guru Nanak Institute of Technology, Panihati, Sodepur': 'North 24 Parganas',
    'Sister Nivedita University, New Town': 'North 24 Parganas',
    'Camellia School of Engineering & Technology, Barasat': 'North 24 Parganas',
    'Techno Bengal Institute of Technology': 'Hooghly',
    'Government College of Engineering & Ceramic Technology, Kolkata': 'Kolkata',
    'Camellia Institute of Technology, Madhyamgram': 'North 24 Parganas',
    'Jalpaiguri Government Engineering College, Jalpaiguri': 'Jalpaiguri',
    'Budge Budge Institute of Technology, Budge Budge': 'South 24 Parganas',
    'Maulana Abul Kalam Azad University of Technology, West Bengal': 'Nadia',
    'Government College of Engineering and Leather Technology, Kolkata': 'Kolkata',
    'Future Institute of Engineering & Management, Sonarpur': 'South 24 Parganas',
    'College of Engineering and Management, Kolaghat': 'Purba Medinipur',
    'Bengal Institute of Technology & Management, Santiniketan': 'Birbhum',
    'University of Kalyani, Kalyani': 'Nadia',
    'Government College of Engineering & Textile Technology, Serampore': 'Hooghly',
    "Sanaka Education Trust's Group of Institutions, Durgapur": 'Paschim Bardhaman',
    'Aliah University, New Town': 'North 24 Parganas',
    'Durgapur Institute of Advanced Technology & Management, Durgapur': 'Paschim Bardhaman',
    'Future Institute of Technology, Boral, Garia': 'South 24 Parganas',
    'Murshidabad College of Engineering & Technology, Murshidabad': 'Murshidabad',
    'Haldia Institute of Pharmacy, Haldia': 'Purba Medinipur',
    'BCDA College of Pharmacy & Technology, Campus 2': 'North 24 Parganas',
    'Rashbehari Pharmaceutical Institute': 'Kolkata',
    'Hemnalini Memorial College of Engineering, Haringhata': 'Nadia',
    'JIS University, Agarpara': 'North 24 Parganas',
    'Calcutta Institute of Pharmaceutical Technology & Allied Health Sciences, Uluberia': 'Howrah',
    'Anand College of Education, Debra': 'Paschim Medinipur',
    'NSHM Knowledge Campus, Kolkata Group of Institutions': 'Kolkata',
    'Techno International Batanagar': 'South 24 Parganas',
    'Gitanjali College of Pharmacy, Lohapur': 'Birbhum',
    'Bengal College of Pharmaceutical Science & Research, Durgapur': 'Paschim Bardhaman',
    'Bengal College of Pharmaceutical Technology, Dubrajpur': 'Birbhum',
    'Guru Nanak Institute of Pharmaceutical Science and Technology, Sodepur': 'North 24 Parganas',
    'Gupta College of Technological Sciences, Asansol': 'Paschim Bardhaman',
    'Birbhum Pharmacy School, Hetampur': 'Birbhum',
    'School of Pharmacy, Techno India University, Salt Lake': 'Kolkata',
    'BCDA College of Pharmacy & Technology, Hridaypur, Madhyamgram': 'North 24 Parganas',
    'Netaji Subhash Chandra Bose Institute of Pharmacy, Chakdaha': 'Nadia',
    'Eminent College of Pharmaceutical Technology, Barasat': 'North 24 Parganas',
    'Gandhari College (School of Pharmacy)': 'Paschim Bardhaman',
    'SKM Institute of Pharmaceutical Sciences and Research': 'Hooghly',
    'St. Thomas College of Engineering & Technology, Kidderpore, Kolkata': 'Kolkata',
    'Ideal Institute of Engineering, Kalyani': 'Nadia',
    'Gargi Memorial Institute of Technology, Baruipur': 'South 24 Parganas',
    'Greater Kolkata College of Engineering & Management, Baruipur': 'South 24 Parganas',
    'Calcutta Institute of Technology, Uluberia': 'Howrah',
    'OmDayal Group of Institutions, Uluberia': 'Howrah',
    'Supreme Knowledge Foundation Group of Institutions, Mankundu': 'Hooghly',
    'NSHM Knowledge Campus, Durgapur Group of Institutions': 'Paschim Bardhaman',
    'Camellia Institute of Engineering and Technology, Bud Bud': 'Purba Bardhaman',
    'Birbhum Institute of Engineering & Technology, Suri': 'Birbhum',
    'Seacom Skills University, Bolpur': 'Birbhum',
    'JLD Engineering and Management College, Baruipur': 'South 24 Parganas',
    'Elitte College of Engineering, Mahispota': 'North 24 Parganas',
    'Camellia Institute of Technology & Management, Bainchi': 'Hooghly',
    'IMPS College of Engineering & Technology, Malda': 'Malda',
    'Mallabhum Institute of Technology, Bishnupur': 'Bankura',
    'Techno Institute of Engineering and Management': 'North 24 Parganas',
    'Dream Institute of Technology, Bishnupur': 'South 24 Parganas',
    'Dumkal Institute of Engineering & Technology, Dumkal': 'Murshidabad',
    'The Neotia University': 'South 24 Parganas',
    'Brainware University': 'North 24 Parganas',
    'Institute of Pharmacy, Jalpaiguri': 'Jalpaiguri',
    'Bharat Technology, Uluberia': 'Howrah',
    'Seacom Pharmacy College': 'Birbhum',
    'East West Education Institute': 'Purba Bardhaman',
    'Derozio Pharma Institute': 'Hooghly',
    'Nurul Institute of Medical Sciences & Research Centre': 'North 24 Parganas',
    'Vidyasagar Pharmaceutical College of Education': 'Paschim Medinipur',
    'Jakir Hossain Institute of Pharmacy': 'Murshidabad',
    'Flemming College of Pharmacy': 'Kolkata',
    'NSHM Institute of Pharmaceutical Technology, Durgapur': 'Paschim Bardhaman',
    'Pandaveswar School of Pharmacy': 'Paschim Bardhaman',
    'IQ City Institute of Pharmaceutical Sciences': 'Paschim Bardhaman',
    'Tarifa Memorial Institute of Pharmacy': 'Murshidabad'
}

def clean_for_match(s):
    s = str(s).lower()
    return re.sub(r'[^a-z0-9]', '', s)

LOOKUP_MAP = {clean_for_match(k): k for k in DISTRICT_MAPPING.keys()}

def normalize_institute(inst):
    raw = str(inst)
    c_raw = clean_for_match(raw)
    
    # Direct match
    if c_raw in LOOKUP_MAP:
        return LOOKUP_MAP[c_raw]
        
    # Difflib match
    matches = difflib.get_close_matches(c_raw, LOOKUP_MAP.keys(), n=1, cutoff=0.7)
    if matches:
        return LOOKUP_MAP[matches[0]]
        
    # Substring match
    for clean_k, original_k in LOOKUP_MAP.items():
        if clean_k in c_raw or c_raw in clean_k:
            return original_k
            
    # Fallback to Title case
    return raw.title()

def get_district(inst):
    return DISTRICT_MAPPING.get(inst, 'Kolkata')

def parse_excel():
    print("Loading excel file...")
    try:
        df = pd.read_excel('wbjee_last_year_cutoff.xlsx')
    except Exception as e:
        print(f"Failed to read excel: {e}")
        return

    total_rows_excel = len(df)
    print(f"Total rows in Excel: {total_rows_excel}")

    # Attempt to find columns dynamically by keywords
    round_col = next((c for c in df.columns if 'round' in c.lower()), None)
    inst_col = next((c for c in df.columns if 'institute' in c.lower() or 'college' in c.lower()), None)
    prog_col = next((c for c in df.columns if 'program' in c.lower() or 'branch' in c.lower() or 'course' in c.lower()), None)
    cat_col = next((c for c in df.columns if 'category' in c.lower() or 'caste' in c.lower()), None)
    quota_col = next((c for c in df.columns if 'quota' in c.lower() or 'state' in c.lower()), None)
    or_col = next((c for c in df.columns if 'open' in c.lower() and 'rank' in c.lower()), None)
    cr_col = next((c for c in df.columns if 'clos' in c.lower() and 'rank' in c.lower()), None)

    # Fallbacks for columns if some don't exist
    if not inst_col: inst_col = df.columns[1] if len(df.columns)>1 else None
    if not prog_col: prog_col = df.columns[2] if len(df.columns)>2 else None

    print(f"Mapped columns: Round={round_col}, Inst={inst_col}, Prog={prog_col}, Cat={cat_col}, Quota={quota_col}, OR={or_col}, CR={cr_col}")

    valid_rows_list = []
    skipped_pwd = 0
    skipped_invalid_rank = 0
    skipped_mopup = 0
    unmatched_institutes = set()

    print("Parsing rows...")
    for idx, row in df.iterrows():
        try:
            raw_inst = clean_text(row[inst_col]) if inst_col else "Unknown Institute"
            raw_prog = clean_text(row[prog_col]) if prog_col else "Unknown Program"
            raw_cat = clean_text(row[cat_col]) if cat_col else "OPEN"
            raw_quota = clean_text(row[quota_col]) if quota_col else "Home State"
            raw_round = clean_text(row[round_col]) if round_col else "Round 1"
            
            # Skip PwD as it artificially inflates ranks for general predictor
            if '(PWD)' in raw_cat.upper():
                skipped_pwd += 1
                continue
            
            # Normalize
            inst = normalize_institute(raw_inst)
            if inst not in DISTRICT_MAPPING:
                unmatched_institutes.add(raw_inst)
                
            prog, is_tfw_prog = normalize_program(raw_prog)
            cat, is_tfw_cat = normalize_category_and_tfw(raw_cat)
            
            is_tfw = is_tfw_prog or is_tfw_cat
            
            quota = normalize_quota(raw_quota)
            rnd = normalize_round(raw_round)
            
            if rnd is None:
                skipped_mopup += 1
                continue

            # Ranks
            try:
                op_raw = int(float(str(row[or_col]).replace(',', ''))) if or_col and pd.notna(row[or_col]) else 0
                cl_raw = int(float(str(row[cr_col]).replace(',', ''))) if cr_col and pd.notna(row[cr_col]) else 0
                
                # Ensure opening rank is always smaller/better than closing rank
                if op_raw > 0 and cl_raw > 0:
                    op_rank = min(op_raw, cl_raw)
                    cl_rank = max(op_raw, cl_raw)
                else:
                    op_rank = op_raw
                    cl_rank = cl_raw
            except ValueError:
                skipped_invalid_rank += 1
                continue # Invalid ranks
            
            if cl_rank <= 0 or not inst or not prog:
                skipped_invalid_rank += 1
                continue

            # Strict Government vs Private matching
            GOV_INSTITUTES = {
                'Jadavpur University',
                'West Bengal University of Animal & Fishery Sciences',
                'Bidhan Chandra Krishi Viswavidyalaya, Mohanpur, Nadia',
                'University of Calcutta',
                'Faculty of Technology, Uttar Banga Krishi Viswavidyalaya',
                'Ghani Khan Choudhury Institute of Engineering & Technology, Malda',
                'University Institute of Technology, Burdwan University',
                'Ramkrishna Mahato Government Engineering College, Purulia',
                'Government College of Engineering & Textile Technology, Berhampore',
                'Alipurduar Government Engineering and Management College',
                'Kalyani Government Engineering College, Kalyani, Nadia',
                'Kazi Nazrul University, Asansol',
                'Cooch Behar Government Engineering College, Cooch Behar',
                'Government College of Engineering & Ceramic Technology, Kolkata',
                'Jalpaiguri Government Engineering College, Jalpaiguri',
                'Maulana Abul Kalam Azad University of Technology, West Bengal',
                'Government College of Engineering and Leather Technology, Kolkata',
                'University of Kalyani, Kalyani',
                'Government College of Engineering & Textile Technology, Serampore',
                'Aliah University, New Town',
                'Institute of Pharmacy, Jalpaiguri'
            }
            
            itype = 'Government' if inst in GOV_INSTITUTES else 'Private'
            
            district = get_district(inst)

            valid_rows_list.append({
                "round": rnd,
                "institute": inst,
                "program": prog,
                "quota": quota,
                "category": cat,
                "tfwStatus": "yes" if is_tfw else "no",
                "openingRank": op_rank,
                "closingRank": cl_rank,
                "isTFW": is_tfw,
                "type": itype,
                "district": district
            })

        except Exception as e:
            print(f"Skipping row {idx} due to error: {e}")

    print(f"Verification Summary:")
    print(f"Total Rows in Excel: {total_rows_excel}")
    print(f"Skipped PwD Rows: {skipped_pwd}")
    print(f"Skipped Invalid Ranks/Empty: {skipped_invalid_rank}")
    print(f"Skipped Mop-up Rounds: {skipped_mopup}")
    print(f"Successfully Parsed Records: {len(valid_rows_list)}")
    
    if unmatched_institutes:
        print(f"\nWarning: The following {len(unmatched_institutes)} institutes could not be matched perfectly to the provided mapping list:")
        for ui in unmatched_institutes:
            print(f" - {ui}")
            
    mismatches = total_rows_excel - (len(valid_rows_list) + skipped_pwd + skipped_invalid_rank + skipped_mopup)
    if mismatches != 0:
        print(f"Warning: Missing/Unaccounted rows: {mismatches}")
    
    with open('src/data/cutoffs.json', 'w', encoding='utf-8') as f:
        json.dump(valid_rows_list, f, indent=2)
    print("Saved to src/data/cutoffs.json")

if __name__ == "__main__":
    parse_excel()
