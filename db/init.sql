SET NAMES utf8mb4;

CREATE TABLE games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    studio VARCHAR(255) NOT NULL,
    year INT,
    guide TEXT,
    rating DECIMAL(3, 1),
    image_url VARCHAR(500)
)CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO games (title, studio, year, rating, image_url, guide) VALUES
('The Witcher 3: Wild Hunt', 'CD Projekt Red', 2015, 9.7, 'https://upload.wikimedia.org/wikipedia/en/0/0c/Witcher_3_cover_art.jpg', 'Инсталация чрез Steam/GOG. RPG с отворен свят.'),
('Hades', 'Supergiant Games', 2020, 9.3, 'https://upload.wikimedia.org/wikipedia/en/c/cc/Hades_cover_art.jpg', 'Roguelike екшън.'),
('Stardew Valley', 'ConcernedApe', 2016, 9.0, 'https://upload.wikimedia.org/wikipedia/en/f/fd/Logo_of_Stardew_Valley.png', 'Фармерска симулация.'),
('Hollow Knight', 'Team Cherry', 2017, 9.1, 'https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg', 'Metroidvania платформър.'),
('Celeste', 'Maddy Makes Games', 2018, 9.2, 'https://cdn.akamai.steamstatic.com/steam/apps/504230/header.jpg', 'Платформър с предизвикателства.');