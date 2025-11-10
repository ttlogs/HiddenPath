class GameManager {
    constructor() {
        this.gameState = 'waiting';
        this.turnTime = 5000;
        this.turnStartTime = 0;
        this.currentTurn = 0;
        this.players = [];
        this.turnOrder = [];
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('playerJoined', (event) => {
            this.addPlayer(event.detail.player);
        });
        
        document.addEventListener('playerLeft', (event) => {
            this.removePlayer(event.detail.playerId);
        });
    }
    
    addPlayer(player) {
        this.players.push(player);
        this.turnOrder.push({ type: 'player', id: player.id });
        console.log(`🎮 Игрок ${player.id} присоединился к игре`);
        
        if (this.gameState === 'waiting' && this.players.length > 0) {
            this.startGame();
        }
    }
    
    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
        this.turnOrder = this.turnOrder.filter(t => !(t.type === 'player' && t.id === playerId));
        console.log(`🎮 Игрок ${playerId} покинул игру`);
    }
    
    startGame() {
        this.gameState = 'playerTurn';
        this.turnStartTime = performance.now();
        this.currentTurn = 1;
        console.log(`🎲 Игра началась! Ход ${this.currentTurn}, очередь игроков`);
        
        document.dispatchEvent(new CustomEvent('turnStarted', {
            detail: { turn: this.currentTurn, phase: 'playerTurn' }
        }));
    }
    
    update(currentTime) {
        const elapsedTime = currentTime - this.turnStartTime;
        
        if (elapsedTime >= this.turnTime) {
            this.nextTurn();
        }
        
        return {
            gameState: this.gameState,
            elapsedTime: elapsedTime,
            remainingTime: this.turnTime - elapsedTime,
            currentTurn: this.currentTurn
        };
    }
    
    nextTurn() {
        if (this.gameState === 'playerTurn') {
            this.gameState = 'mobTurn';
            console.log(`🎲 Ход ${this.currentTurn}, очередь мобов`);
            
            document.dispatchEvent(new CustomEvent('turnStarted', {
                detail: { turn: this.currentTurn, phase: 'mobTurn' }
            }));
        } else if (this.gameState === 'mobTurn') {
            this.currentTurn++;
            this.gameState = 'playerTurn';
            console.log(`🎲 Ход ${this.currentTurn}, очередь игроков`);
            
            document.dispatchEvent(new CustomEvent('turnStarted', {
                detail: { turn: this.currentTurn, phase: 'playerTurn' }
            }));
        }
        
        this.turnStartTime = performance.now();
    }
    
    getGameState() {
        return {
            state: this.gameState,
            turn: this.currentTurn,
            players: this.players.length
        };
    }
}