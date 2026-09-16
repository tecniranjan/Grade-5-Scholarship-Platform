-- GENIUS ONE Blood Report Platform - Complete Schema
-- Grade 5 Scholarship Exam Analysis System

DROP TABLE IF EXISTS nipunatha_scores CASCADE;
DROP TABLE IF EXISTS blood_reports CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS exam_sessions CASCADE;
DROP TABLE IF EXISTS exam_schedule CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS nipunatha CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  grade INT NOT NULL CHECK (grade IN (3,4,5)),
  school VARCHAR(150),
  district VARCHAR(100),
  parent_phone VARCHAR(20),
  parent_email VARCHAR(100),
  medium VARCHAR(2) NOT NULL DEFAULT 'SI' CHECK (medium IN ('SI','TA','EN')),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  grade INT NOT NULL,
  month_no INT NOT NULL,
  year INT NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  payment_ref VARCHAR(100),
  amount_lkr INT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, grade, month_no, year)
);

CREATE TABLE nipunatha (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_si VARCHAR(200) NOT NULL,
  name_ta VARCHAR(200) NOT NULL,
  grade INT NOT NULL CHECK (grade IN (3,4,5)),
  max_marks_per_paper INT NOT NULL DEFAULT 4,
  display_order INT NOT NULL DEFAULT 0,
  UNIQUE(code, grade)
);

CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  nipunatha_id INT REFERENCES nipunatha(id) ON DELETE CASCADE,
  grade INT NOT NULL CHECK (grade IN (3,4,5)),
  month_no INT NOT NULL DEFAULT 1,
  difficulty_level INT NOT NULL DEFAULT 1,
  question_text_si TEXT NOT NULL,
  question_text_ta TEXT,
  question_text_en TEXT,
  option_a_si TEXT NOT NULL, option_a_ta TEXT, option_a_en TEXT,
  option_b_si TEXT NOT NULL, option_b_ta TEXT, option_b_en TEXT,
  option_c_si TEXT NOT NULL, option_c_ta TEXT, option_c_en TEXT,
  option_d_si TEXT NOT NULL, option_d_ta TEXT, option_d_en TEXT,
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
  marks INT DEFAULT 1,
  image_url VARCHAR(500),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE exam_schedule (
  id SERIAL PRIMARY KEY,
  grade INT NOT NULL CHECK (grade IN (3,4,5)),
  month_no INT NOT NULL,
  year INT NOT NULL,
  medium VARCHAR(2) DEFAULT 'SI',
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(grade, month_no, year)
);

CREATE TABLE exam_sessions (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  schedule_id INT REFERENCES exam_schedule(id),
  grade INT NOT NULL,
  month_no INT NOT NULL,
  year INT NOT NULL,
  medium VARCHAR(2) DEFAULT 'SI',
  started_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('pending','in_progress','submitted','graded','timed_out')),
  question_order JSONB,
  time_remaining_seconds INT DEFAULT 3600,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, grade, month_no, year)
);

CREATE TABLE answers (
  id SERIAL PRIMARY KEY,
  session_id INT REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id INT REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer CHAR(1) CHECK (selected_answer IN ('A','B','C','D')),
  is_correct BOOLEAN,
  marks_obtained INT DEFAULT 0,
  answered_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, question_id)
);

CREATE TABLE blood_reports (
  id SERIAL PRIMARY KEY,
  student_id INT REFERENCES students(id) ON DELETE CASCADE,
  session_id INT REFERENCES exam_sessions(id),
  grade INT NOT NULL,
  month_no INT NOT NULL,
  year INT NOT NULL,
  total_marks INT,
  max_marks INT,
  percentage DECIMAL(5,2),
  report_data JSONB,
  pdf_url VARCHAR(255),
  generated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, grade, month_no, year)
);

CREATE TABLE nipunatha_scores (
  id SERIAL PRIMARY KEY,
  report_id INT REFERENCES blood_reports(id) ON DELETE CASCADE,
  nipunatha_id INT REFERENCES nipunatha(id) ON DELETE CASCADE,
  marks_obtained INT,
  max_marks INT,
  percentage DECIMAL(5,2),
  UNIQUE(report_id, nipunatha_id)
);

CREATE INDEX idx_questions_grade_month ON questions(grade, month_no);
CREATE INDEX idx_questions_nipunatha ON questions(nipunatha_id);
CREATE INDEX idx_sessions_student ON exam_sessions(student_id);
CREATE INDEX idx_reports_student ON blood_reports(student_id);
CREATE INDEX idx_subscriptions_student ON subscriptions(student_id);
CREATE INDEX idx_students_phone ON students(parent_phone);
