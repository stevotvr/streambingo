SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;


CREATE TABLE `cards` (
  `id` int(11) NOT NULL,
  `gameId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `grid` text NOT NULL,
  `marked` text NOT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `games` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `gameName` varchar(32) NOT NULL,
  `gameType` int(11) NOT NULL DEFAULT 0,
  `balls` text NOT NULL,
  `called` text NOT NULL,
  `ended` tinyint(1) NOT NULL DEFAULT 0,
  `winner` int(11) DEFAULT NULL,
  `winnerName` varchar(32) DEFAULT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `game_settings` (
  `gameName` varchar(32) NOT NULL,
  `autoCall` int(11) NOT NULL DEFAULT 30,
  `autoRestart` int(11) NOT NULL DEFAULT 60,
  `autoEnd` int(11) NOT NULL DEFAULT 30,
  `tts` tinyint(1) NOT NULL DEFAULT 0,
  `ttsVoice` text NOT NULL,
  `background` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `stats` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `gameName` varchar(32) NOT NULL,
  `numPlayers` int(11) NOT NULL,
  `grid` text NOT NULL,
  `marked` text NOT NULL,
  `called` text NOT NULL,
  `time` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(32) NOT NULL,
  `gameToken` varchar(64) NOT NULL,
  `twitchId` int(11) DEFAULT NULL,
  `accessToken` varchar(64) DEFAULT NULL,
  `refreshToken` varchar(64) DEFAULT NULL,
  `host` tinyint(1) NOT NULL DEFAULT 0,
  `created` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


ALTER TABLE `cards`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `gameId_2` (`gameId`,`userId`),
  ADD KEY `gameId` (`gameId`),
  ADD KEY `userId` (`userId`);

ALTER TABLE `games`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `gameName` (`gameName`) USING BTREE,
  ADD KEY `userId` (`userId`),
  ADD KEY `winner` (`winner`);

ALTER TABLE `game_settings`
  ADD PRIMARY KEY (`gameName`);

ALTER TABLE `stats`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`),
  ADD KEY `gameName` (`gameName`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `gameToken` (`gameToken`),
  ADD UNIQUE KEY `twitchId` (`twitchId`),
  ADD KEY `name` (`name`);


ALTER TABLE `cards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `games`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `stats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;


ALTER TABLE `cards`
  ADD CONSTRAINT `cards_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cards_ibfk_2` FOREIGN KEY (`gameId`) REFERENCES `games` (`id`) ON DELETE CASCADE;

ALTER TABLE `games`
  ADD CONSTRAINT `games_ibfk_2` FOREIGN KEY (`winner`) REFERENCES `cards` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `games_ibfk_3` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `stats`
  ADD CONSTRAINT `stats_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
