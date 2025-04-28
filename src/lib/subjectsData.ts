// Subject data organized by branch and semester
export type Branch = 'CSE' | 'IT' | 'BIOTECH' | 'ECE' | 'BBA';
export type Semester = 'Semester 1' | 'Semester 2' | 'Semester 3' | 'Semester 4' | 'Semester 5' | 'Semester 6' | 'Semester 7' | 'Semester 8';

export interface SubjectData {
  [branch: string]: {
    [semester: string]: string[];
  };
}

export const subjectsData: SubjectData = {
  'CSE': {
    'Semester 1': ['C Programming', 'Physics-1'],
    'Semester 2': ['Physics-2', 'OOPS'],
    'Semester 3': ['Electrical Science', 'DBMS'],
    'Semester 4': ['Digital Systems', 'EVS'],
    'Semester 5': ['Operating System', 'COA'],
    'Semester 6': ['Blockchain', 'Computer Networks'],
    'Semester 7': ['Graph Theory', 'Political Philosophy'],
    'Semester 8': ['Astrophysics', 'Agile Methodology']
  },
  'IT': {
    'Semester 1': ['C Programming', 'Physics-1'],
    'Semester 2': ['Physics-2', 'OOPS'],
    'Semester 3': ['Electrical Science', 'DBMS'],
    'Semester 4': ['Digital Systems', 'EVS'],
    'Semester 5': ['Operating System', 'COA'],
    'Semester 6': ['Blockchain', 'Computer Networks'],
    'Semester 7': ['Graph Theory', 'Political Philosophy'],
    'Semester 8': ['Astrophysics', 'Agile Methodology']
  },
  'BIOTECH': {
    'Semester 1': ['Biology Fundamentals', 'Chemistry-1'],
    'Semester 2': ['Chemistry-2', 'Cell Biology'],
    'Semester 3': ['Biochemistry', 'Microbiology'],
    'Semester 4': ['Genetics', 'Molecular Biology'],
    'Semester 5': ['Immunology', 'Bioprocess Engineering'],
    'Semester 6': ['Bioinformatics', 'Genomics'],
    'Semester 7': ['Tissue Engineering', 'Bioethics'],
    'Semester 8': ['Pharmaceutical Biotechnology', 'Biosafety']
  },
  'ECE': {
    'Semester 1': ['Basic Electronics', 'Physics-1'],
    'Semester 2': ['Physics-2', 'Circuit Theory'],
    'Semester 3': ['Analog Electronics', 'Digital Electronics'],
    'Semester 4': ['Microprocessors', 'Signals and Systems'],
    'Semester 5': ['Communication Systems', 'Control Systems'],
    'Semester 6': ['VLSI Design', 'Embedded Systems'],
    'Semester 7': ['Wireless Communication', 'Antenna Theory'],
    'Semester 8': ['IoT Systems', 'Robotics']
  },
  'BBA': {
    'Semester 1': ['Principles of Management', 'Business Economics'],
    'Semester 2': ['Financial Accounting', 'Business Communication'],
    'Semester 3': ['Marketing Management', 'Organizational Behavior'],
    'Semester 4': ['Business Law', 'Human Resource Management'],
    'Semester 5': ['Operations Management', 'Financial Management'],
    'Semester 6': ['Strategic Management', 'International Business'],
    'Semester 7': ['Entrepreneurship', 'Business Ethics'],
    'Semester 8': ['Project Management', 'Digital Marketing']
  }
};

// Get all subjects across all branches and semesters
export const getAllSubjects = (): string[] => {
  const allSubjects = new Set<string>();
  
  Object.values(subjectsData).forEach(branchData => {
    Object.values(branchData).forEach(subjects => {
      subjects.forEach(subject => allSubjects.add(subject));
    });
  });
  
  return Array.from(allSubjects).sort();
};

// Get subjects for a specific branch and semester
export const getSubjectsForBranchAndSemester = (branch: string, semester: string): string[] => {
  if (!branch || branch === 'All Courses' || !semester || semester === 'All Semesters') {
    return [];
  }
  
  return subjectsData[branch]?.[semester] || [];
};
