


CREATE DATABASE IF NOT EXISTS research_portal
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE research_portal;

CREATE TABLE IF NOT EXISTS opportunities (
    id                    INT AUTO_INCREMENT PRIMARY KEY,

    title                 VARCHAR(255)            NOT NULL,
    description           TEXT                     NOT NULL,
    research_area         VARCHAR(150)            NOT NULL,
    faculty_name          VARCHAR(150)            NOT NULL,
    department            VARCHAR(150)            NOT NULL,
    required_skills       VARCHAR(255)            NOT NULL,

    available_positions   INT                      NOT NULL,
    application_deadline  DATE                     NOT NULL,
    status                ENUM('Open', 'Closed')  NOT NULL DEFAULT 'Open',

    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    
    CONSTRAINT chk_positions_non_negative CHECK (available_positions >= 0)
);


CREATE INDEX idx_opportunities_status ON opportunities (status);
CREATE INDEX idx_opportunities_department ON opportunities (department);


INSERT INTO opportunities
    (title, description, research_area, faculty_name, department, required_skills, available_positions, application_deadline, status)
VALUES
    ('AI in Healthcare Diagnostics',
     'Exploring machine learning models for early disease detection using medical imaging data.',
     'Artificial Intelligence', 'Dr. Ayesha Khan', 'Computer Science',
     'Python, TensorFlow, Image Processing', 2, '2026-12-15', 'Open'),

    ('Sustainable Urban Water Systems',
     'Investigating low-cost sensor networks for monitoring urban water quality in real time.',
     'Environmental Engineering', 'Dr. Bilal Ahmed', 'Civil Engineering',
     'IoT, Data Analysis, MATLAB', 3, '2026-11-30', 'Open');