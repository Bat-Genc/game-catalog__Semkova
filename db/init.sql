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
    epic_url VARCHAR(500),
    summary TEXT,
    genres VARCHAR(255),
    platforms VARCHAR(500),
    igdb_url VARCHAR(500),
    screenshots JSON,
    pegi_age TINYINT,
    age_synopsis TEXT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AUTH
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS likes (
    user_id INT NOT NULL,
    game_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, game_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;