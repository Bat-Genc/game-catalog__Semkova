SET NAMES utf8mb4;

CREATE TABLE games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    studio VARCHAR(255) NOT NULL,
    year INT,
    guide TEXT,
    rating DECIMAL(3, 1),
    image_url VARCHAR(500),
    official_tags VARCHAR(255),
    content_explanation TEXT,
    steam_url VARCHAR(500),
    epic_url VARCHAR(500)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;