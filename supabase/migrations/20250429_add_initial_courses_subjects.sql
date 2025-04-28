-- Add initial courses
INSERT INTO public.courses (name) VALUES 
('CSE'),
('IT'),
('ECE'),
('Mechanical'),
('Civil'),
('Biotechnology')
ON CONFLICT (name) DO NOTHING;

-- Add subjects for CSE (Computer Science Engineering)
WITH cse_id AS (SELECT id FROM public.courses WHERE name = 'CSE')
INSERT INTO public.subjects (name, course_id, semester)
VALUES
-- Semester 1
('Mathematics I', (SELECT id FROM cse_id), 1),
('Physics', (SELECT id FROM cse_id), 1),
('Basic Electrical Engineering', (SELECT id FROM cse_id), 1),
('Programming Fundamentals', (SELECT id FROM cse_id), 1),
('Engineering Graphics', (SELECT id FROM cse_id), 1),

-- Semester 2
('Mathematics II', (SELECT id FROM cse_id), 2),
('Chemistry', (SELECT id FROM cse_id), 2),
('Data Structures', (SELECT id FROM cse_id), 2),
('Digital Electronics', (SELECT id FROM cse_id), 2),
('Communication Skills', (SELECT id FROM cse_id), 2),

-- Semester 3
('Discrete Mathematics', (SELECT id FROM cse_id), 3),
('Object-Oriented Programming', (SELECT id FROM cse_id), 3),
('Computer Organization', (SELECT id FROM cse_id), 3),
('Database Management Systems', (SELECT id FROM cse_id), 3),
('Operating Systems', (SELECT id FROM cse_id), 3),

-- Semester 4
('Design and Analysis of Algorithms', (SELECT id FROM cse_id), 4),
('Computer Networks', (SELECT id FROM cse_id), 4),
('Software Engineering', (SELECT id FROM cse_id), 4),
('Theory of Computation', (SELECT id FROM cse_id), 4),
('Web Technologies', (SELECT id FROM cse_id), 4),

-- Semester 5
('Compiler Design', (SELECT id FROM cse_id), 5),
('Artificial Intelligence', (SELECT id FROM cse_id), 5),
('Computer Graphics', (SELECT id FROM cse_id), 5),
('Information Security', (SELECT id FROM cse_id), 5),
('Cloud Computing', (SELECT id FROM cse_id), 5),

-- Semester 6
('Machine Learning', (SELECT id FROM cse_id), 6),
('Big Data Analytics', (SELECT id FROM cse_id), 6),
('Mobile Application Development', (SELECT id FROM cse_id), 6),
('Internet of Things', (SELECT id FROM cse_id), 6),
('Distributed Systems', (SELECT id FROM cse_id), 6),

-- Semester 7
('Deep Learning', (SELECT id FROM cse_id), 7),
('Natural Language Processing', (SELECT id FROM cse_id), 7),
('Blockchain Technology', (SELECT id FROM cse_id), 7),
('Quantum Computing', (SELECT id FROM cse_id), 7),
('Project Management', (SELECT id FROM cse_id), 7),

-- Semester 8
('Capstone Project', (SELECT id FROM cse_id), 8),
('Ethics in Computing', (SELECT id FROM cse_id), 8),
('Entrepreneurship', (SELECT id FROM cse_id), 8)
ON CONFLICT (name, course_id, semester) DO NOTHING;

-- Add subjects for IT (Information Technology)
WITH it_id AS (SELECT id FROM public.courses WHERE name = 'IT')
INSERT INTO public.subjects (name, course_id, semester)
VALUES
-- Semester 1
('Mathematics I', (SELECT id FROM it_id), 1),
('Physics', (SELECT id FROM it_id), 1),
('Introduction to IT', (SELECT id FROM it_id), 1),
('Programming Fundamentals', (SELECT id FROM it_id), 1),
('Digital Logic', (SELECT id FROM it_id), 1),

-- Semester 2
('Mathematics II', (SELECT id FROM it_id), 2),
('Chemistry', (SELECT id FROM it_id), 2),
('Data Structures', (SELECT id FROM it_id), 2),
('Object-Oriented Programming', (SELECT id FROM it_id), 2),
('Communication Skills', (SELECT id FROM it_id), 2),

-- Semester 3
('Discrete Mathematics', (SELECT id FROM it_id), 3),
('Database Systems', (SELECT id FROM it_id), 3),
('Computer Networks', (SELECT id FROM it_id), 3),
('Operating Systems', (SELECT id FROM it_id), 3),
('Web Development', (SELECT id FROM it_id), 3),

-- Semester 4
('Design and Analysis of Algorithms', (SELECT id FROM it_id), 4),
('Software Engineering', (SELECT id FROM it_id), 4),
('Information Security', (SELECT id FROM it_id), 4),
('Data Mining', (SELECT id FROM it_id), 4),
('Mobile Computing', (SELECT id FROM it_id), 4),

-- Semester 5
('Cloud Computing', (SELECT id FROM it_id), 5),
('Artificial Intelligence', (SELECT id FROM it_id), 5),
('Internet of Things', (SELECT id FROM it_id), 5),
('Big Data Analytics', (SELECT id FROM it_id), 5),
('IT Infrastructure Management', (SELECT id FROM it_id), 5),

-- Semester 6
('Machine Learning', (SELECT id FROM it_id), 6),
('Enterprise Resource Planning', (SELECT id FROM it_id), 6),
('E-Commerce and E-Business', (SELECT id FROM it_id), 6),
('IT Service Management', (SELECT id FROM it_id), 6),
('Human-Computer Interaction', (SELECT id FROM it_id), 6),

-- Semester 7
('Business Intelligence', (SELECT id FROM it_id), 7),
('IT Project Management', (SELECT id FROM it_id), 7),
('Cybersecurity', (SELECT id FROM it_id), 7),
('Data Visualization', (SELECT id FROM it_id), 7),
('IT Ethics and Governance', (SELECT id FROM it_id), 7),

-- Semester 8
('Capstone Project', (SELECT id FROM it_id), 8),
('IT Strategy and Management', (SELECT id FROM it_id), 8),
('Emerging Technologies', (SELECT id FROM it_id), 8)
ON CONFLICT (name, course_id, semester) DO NOTHING;

-- Add subjects for ECE (Electronics and Communication Engineering)
WITH ece_id AS (SELECT id FROM public.courses WHERE name = 'ECE')
INSERT INTO public.subjects (name, course_id, semester)
VALUES
-- Semester 1
('Mathematics I', (SELECT id FROM ece_id), 1),
('Physics', (SELECT id FROM ece_id), 1),
('Basic Electrical Engineering', (SELECT id FROM ece_id), 1),
('Engineering Graphics', (SELECT id FROM ece_id), 1),
('Programming Fundamentals', (SELECT id FROM ece_id), 1),

-- Semester 2
('Mathematics II', (SELECT id FROM ece_id), 2),
('Chemistry', (SELECT id FROM ece_id), 2),
('Electronic Devices', (SELECT id FROM ece_id), 2),
('Digital Electronics', (SELECT id FROM ece_id), 2),
('Communication Skills', (SELECT id FROM ece_id), 2),

-- Semester 3
('Signals and Systems', (SELECT id FROM ece_id), 3),
('Analog Electronics', (SELECT id FROM ece_id), 3),
('Digital System Design', (SELECT id FROM ece_id), 3),
('Electromagnetic Theory', (SELECT id FROM ece_id), 3),
('Data Structures', (SELECT id FROM ece_id), 3),

-- Semester 4
('Communication Systems', (SELECT id FROM ece_id), 4),
('Microprocessors and Microcontrollers', (SELECT id FROM ece_id), 4),
('Control Systems', (SELECT id FROM ece_id), 4),
('VLSI Design', (SELECT id FROM ece_id), 4),
('Antenna and Wave Propagation', (SELECT id FROM ece_id), 4)
ON CONFLICT (name, course_id, semester) DO NOTHING;
