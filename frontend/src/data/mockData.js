export const PATIENTS = [
  // Active patients
  { id: 'RM-0001', name: 'Sunita Devi',      age: 42, gender: 'Female', village: 'Ramnagar',  district: 'Varanasi', phone: '9876543210', abha: 'sunita@abha', lastVisit: '2026-03-15', diagnosis: 'Hypertension - Controlled',        status: 'Active',   weight: 58, bpSystolic: 135, bpDiastolic: 88, temperature: 98.2 },
  { id: 'RM-0002', name: 'Ramesh Kumar',     age: 58, gender: 'Male',   village: 'Chandpur',  district: 'Varanasi', phone: '9812345678', abha: 'ramesh@abha', lastVisit: '2026-03-14', diagnosis: 'Type 2 Diabetes - Moderate',     status: 'Active',   weight: 75, bpSystolic: 142, bpDiastolic: 92, temperature: 98.5 },
  { id: 'RM-0003', name: 'Priya Sharma',     age: 28, gender: 'Female', village: 'Nandgaon', district: 'Varanasi', phone: '9856781234', abha: 'priya@abha',  lastVisit: '2026-03-13', diagnosis: 'Iron Deficiency Anaemia',       status: 'Active',   weight: 52, bpSystolic: 118, bpDiastolic: 76, temperature: 98.1 },
  { id: 'RM-0004', name: 'Abdul Rehman',     age: 65, gender: 'Male',   village: 'Fatehpur', district: 'Varanasi', phone: '9845671234', abha: 'abdul@abha',  lastVisit: '2026-03-12', diagnosis: 'COPD - with bronchodilators',  status: 'Active',   weight: 68, bpSystolic: 138, bpDiastolic: 85, temperature: 98.7 },
  { id: 'RM-0005', name: 'Meena Bai',        age: 35, gender: 'Female', village: 'Ramnagar', district: 'Varanasi', phone: '9823456789', abha: 'meena@abha',  lastVisit: '2026-03-11', diagnosis: 'TB (treatment ongoing)',       status: 'Active',   weight: 54, bpSystolic: 120, bpDiastolic: 78, temperature: 98.3 },
  { id: 'RM-0006', name: 'Vikram Singh',     age: 48, gender: 'Male',   village: 'Ramnagar', district: 'Varanasi', phone: '9834567890', abha: 'vikram@abha', lastVisit: '2026-03-10', diagnosis: 'Essential Hypertension',      status: 'Active',   weight: 72, bpSystolic: 158, bpDiastolic: 98, temperature: 98.6 },
  { id: 'RM-0007', name: 'Anjali Patel',     age: 32, gender: 'Female', village: 'Chandpur', district: 'Varanasi', phone: '9845678901', abha: 'anjali@abha', lastVisit: '2026-03-09', diagnosis: 'Asthma - well-controlled',     status: 'Active',   weight: 56, bpSystolic: 122, bpDiastolic: 80, temperature: 98.2 },
  { id: 'RM-0008', name: 'Ravi Tiwari',      age: 55, gender: 'Male',   village: 'Nandgaon', district: 'Varanasi', phone: '9856789012', abha: 'ravi@abha',   lastVisit: '2026-03-08', diagnosis: 'Gastritis with GERD',         status: 'Active',   weight: 70, bpSystolic: 128, bpDiastolic: 82, temperature: 98.4 },
  { id: 'RM-0009', name: 'Fatima Khan',      age: 44, gender: 'Female', village: 'Fatehpur', district: 'Varanasi', phone: '9867890123', abha: 'fatima@abha', lastVisit: '2026-03-07', diagnosis: 'Migraine - episodic',       status: 'Active',   weight: 60, bpSystolic: 125, bpDiastolic: 81, temperature: 98.1 },
  { id: 'RM-0010', name: 'Prakash Desai',    age: 62, gender: 'Male',   village: 'Ramnagar', district: 'Varanasi', phone: '9878901234', abha: 'prakash@abha',lastVisit: '2026-03-06', diagnosis: 'Chronic Kidney Disease Stage 3',status: 'Active', weight: 66, bpSystolic: 145, bpDiastolic: 90, temperature: 98.5 },
  
  // Referred patients
  { id: 'RM-0011', name: 'Deepa Gupta',      age: 38, gender: 'Female', village: 'Chandpur', district: 'Varanasi', phone: '9889012345', abha: 'deepa@abha',  lastVisit: '2026-03-05', diagnosis: 'Acute Myocardial Infarction',   status: 'Referred', weight: 65, bpSystolic: 160, bpDiastolic: 100, temperature: 98.8 },
  { id: 'RM-0012', name: 'Mohan Lal',        age: 71, gender: 'Male',   village: 'Nandgaon', district: 'Varanasi', phone: '9890123456', abha: 'mohan@abha',   lastVisit: '2026-03-04', diagnosis: 'Acute Stroke (Ischemic)',      status: 'Referred', weight: 69, bpSystolic: 175, bpDiastolic: 105, temperature: 99.1 },
];

export const DRUGS = [
  'Paracetamol 500mg',     'Amoxicillin 500mg',     'Metformin 500mg',      'Amlodipine 5mg',
  'Atorvastatin 10mg',     'Omeprazole 20mg',       'Cetirizine 10mg',      'Ibuprofen 400mg',
  'Azithromycin 500mg',    'ORS Sachet',            'Iron + Folic Acid',    'Salbutamol Inhaler',
  'Aspirin 300mg',         'Losartan 50mg',         'Acarbose 50mg',        'Enalapril 5mg',
  'Clopidogrel 75mg',      'Isoniazid 300mg',       'Rifampicin 450mg',     'Vitamin C 500mg',
];

export const FACS = [
  'PHC Ramnagar', 'CHC Chandpur', 'District Hospital Varanasi',
  'AIIMS Jodhpur', 'SN Medical College', 'PHC Fatehpur', 'Urban PHC Lucknow',
];

export const TODAY_STR = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
export const TODAY_ISO = new Date().toISOString().split('T')[0];

export const PAGE_TITLES = {
  home:         'Dashboard',
  patients:     'Patient Records',
  prescription: 'Prescription',
  refer:        'Refer Patient',
  feedback:     'Feedback',
  summary:      'Doctor Summary',
};
