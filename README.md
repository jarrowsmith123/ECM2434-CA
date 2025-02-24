## Project Overview
This game is designed to promote sustainability and environmental awareness through an engaging and interactive experience set around Exeter University campus. Players collect and level up unique monsters, each representing different aspects of sustainability, including food waste, health, water conservation, renewable energy, biodiversity, and transport. 

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [License](#license)

## Installation
To run the game, follow these steps:
1. Clone the Repository
```sh
git clone https://github.com/jarrowsmith123/ECM2434-CA
```
2. Navigate to the game directory
```sh
cd ECM2434-CA
```
3. Install dependencies
```sh
npm install
```
4. To start the backend server, navigate to the backend directory and run
```sh
python3 manage.py runserver
```
4. To start the frontend server, navigate to the frontend directory and run
```sh
npm start
```

## Usage
This game is designed to encourage students to explore their campus while learning about sustainability. By collecting monsters tied to real-world sustainability efforts, players can engage with key environmental issues and improve their knowledge of sustainability in a fun and interactive way.

**Starting the Game**
After installation, open your browser and navigate to:
localhost:3000/register/

**Game Progression**
1. Daily Login: players earn bonus currency each time they log into the game
2. Upgrading Monsters: use earned currency to upgrade your monster levels and stats
3. Completing Challenges: Take on sustainability challenges and use your monsters combined power to defeat them and earn rewards

**Leaderboard and Social Features**
- Compare progress: view your friends scores and see where you stand on the leaderboard
- Invite and Challenge friends: Invite friends to join challenges and compare who has the most points

## Features
- **Monster Collection**: Players will find Monster Packs at designated campus locations, each containing a random monster associated with a specific sustainability category.
Every week, the pack resets, encouraging continuous exploration.
Players can collect monsters and level them up over time.
Duplicate monsters will grant level-up points to enhance your existing monsters.

- **Challenges**: Players will face various sustainability challenges related to issues like food waste, air pollution and health.
To overcome these challenges, players select up to five monsters, each with a specific score based on their category. The combined score of the selected monsters must exceed the challenge's difficulty rating in order to succeed.

- **Game Progression and Leaderboards**: Players earn currency by completing challenges, logging in daily, and reaching milestones. This currency can be used to upgrade monster's levels.
A player's overall level is the sum of their monsters' levels, allowing for continuous game progression. 
The leaderboard tracks players' progress, showing who is ahead in the game.

- **Multiplayer and Social Features**: Players can add friends, view their profiles, and compare their progress on the leaderboard. Friend scores are stored in the database and linked through user IDs, creating a personalised competitive experience. 

- **Campus Integration**: The game integrates with Exeter University's sustainability efforts. Locations around campus are tied to sustainability categories:
    - Food Banks for food sustainability
    - Solar panels for renewable energy
Players are encouraged to visit these locations, earn monster packs, and learn about sustainability initiatives on campus.

## License
This project is licensed under the [MIT License](LICENSE)

