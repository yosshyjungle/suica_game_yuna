// スイカゲーム風パズルゲーム - JavaScript

// ゲームの基本設定
const GAME_CONFIG = {
    CANVAS_WIDTH: 400,
    CANVAS_HEIGHT: 600,
    GRAVITY: 0.5,
    FRICTION: 0.98,
    BOUNCE: 0.7,
    FRUIT_SIZE_MULTIPLIER: 1.2
};

// フルーツの種類と設定
const FRUIT_TYPES = [
    { name: 'cherry', emoji: '🍒', size: 20, color: '#ff6b6b', points: 1 },
    { name: 'strawberry', emoji: '🍓', size: 30, color: '#ff4757', points: 3 },
    { name: 'grape', emoji: '🍇', size: 40, color: '#a55eea', points: 6 },
    { name: 'orange', emoji: '🍊', size: 50, color: '#ffa502', points: 10 },
    { name: 'apple', emoji: '🍎', size: 60, color: '#ff3838', points: 15 },
    { name: 'watermelon', emoji: '🍉', size: 80, color: '#2ed573', points: 25 }
];

// ゲーム状態管理
class GameState {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextFruitCanvas = document.getElementById('nextFruitCanvas');
        this.nextFruitCtx = this.nextFruitCanvas.getContext('2d');
        
        this.fruits = [];
        this.score = 0;
        this.gameOver = false;
        this.nextFruitType = 0;
        
        this.mouseX = GAME_CONFIG.CANVAS_WIDTH / 2;
        this.isMouseDown = false;
        
        this.setupEventListeners();
        this.generateNextFruit();
        this.gameLoop();
    }
    
    // イベントリスナーの設定
    setupEventListeners() {
        // マウスイベント
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.gameOver) {
                this.dropFruit();
            }
        });
        
        // タッチイベント（モバイル対応）
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.mouseX = touch.clientX - rect.left;
        });
        
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.gameOver) {
                this.dropFruit();
            }
        });
        
        // リスタートボタン
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restart();
        });
    }
    
    // フルーツを落下させる
    dropFruit() {
        const fruitType = FRUIT_TYPES[this.nextFruitType];
        const fruit = new Fruit(this.mouseX, 50, fruitType);
        this.fruits.push(fruit);
        this.generateNextFruit();
    }
    
    // 次のフルーツを生成
    generateNextFruit() {
        this.nextFruitType = Math.floor(Math.random() * 3); // 最初の3種類からランダム
        this.drawNextFruit();
    }
    
    // 次のフルーツを描画
    drawNextFruit() {
        const ctx = this.nextFruitCtx;
        const fruitType = FRUIT_TYPES[this.nextFruitType];
        
        ctx.clearRect(0, 0, 40, 40);
        ctx.fillStyle = fruitType.color;
        ctx.beginPath();
        ctx.arc(20, 20, fruitType.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // フルーツの絵文字を描画
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(fruitType.emoji, 20, 25);
    }
    
    // ゲームループ
    gameLoop() {
        this.update();
        this.draw();
        
        if (!this.gameOver) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    // ゲーム状態の更新
    update() {
        // フルーツの物理演算
        for (let i = this.fruits.length - 1; i >= 0; i--) {
            const fruit = this.fruits[i];
            fruit.update();
            
            // 画面外に出たフルーツを削除
            if (fruit.y > GAME_CONFIG.CANVAS_HEIGHT + 100) {
                this.fruits.splice(i, 1);
                continue;
            }
            
            // ゲームオーバー判定
            if (fruit.y < 0) {
                this.gameOver = true;
                this.showGameOverScreen();
                return;
            }
            
            // 他のフルーツとの衝突判定
            for (let j = i + 1; j < this.fruits.length; j++) {
                const otherFruit = this.fruits[j];
                if (this.checkCollision(fruit, otherFruit)) {
                    this.handleCollision(fruit, otherFruit, i, j);
                    break;
                }
            }
        }
    }
    
    // 衝突判定
    checkCollision(fruit1, fruit2) {
        const dx = fruit1.x - fruit2.x;
        const dy = fruit1.y - fruit2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (fruit1.size + fruit2.size) / 2;
        
        return distance < minDistance;
    }
    
    // 衝突処理
    handleCollision(fruit1, fruit2, index1, index2) {
        // 同じ種類のフルーツかチェック
        if (fruit1.type.name === fruit2.type.name) {
            // 合体処理
            const newFruitTypeIndex = FRUIT_TYPES.findIndex(f => f.name === fruit1.type.name) + 1;
            
            if (newFruitTypeIndex < FRUIT_TYPES.length) {
                // 新しいフルーツを作成
                const newFruitType = FRUIT_TYPES[newFruitTypeIndex];
                const newX = (fruit1.x + fruit2.x) / 2;
                const newY = (fruit1.y + fruit2.y) / 2;
                const newFruit = new Fruit(newX, newY, newFruitType);
                
                // スコア加算
                this.score += fruit1.type.points + fruit2.type.points;
                this.updateScore();
                
                // フルーツを削除して新しいフルーツを追加
                this.fruits.splice(index1, 1);
                this.fruits.splice(index2 - 1, 1); // index1を削除したのでindex2を調整
                this.fruits.push(newFruit);
                
                // アニメーション効果
                this.addBounceEffect(newX, newY);
            }
        } else {
            // 異なる種類の場合は物理的な反発
            this.handleBounce(fruit1, fruit2);
        }
    }
    
    // 物理的な反発処理
    handleBounce(fruit1, fruit2) {
        const dx = fruit1.x - fruit2.x;
        const dy = fruit1.y - fruit2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < (fruit1.size + fruit2.size) / 2) {
            const overlap = (fruit1.size + fruit2.size) / 2 - distance;
            const separationX = (dx / distance) * overlap / 2;
            const separationY = (dy / distance) * overlap / 2;
            
            fruit1.x += separationX;
            fruit1.y += separationY;
            fruit2.x -= separationX;
            fruit2.y -= separationY;
            
            // 速度の交換
            const tempVx = fruit1.vx;
            const tempVy = fruit1.vy;
            fruit1.vx = fruit2.vx * GAME_CONFIG.BOUNCE;
            fruit1.vy = fruit2.vy * GAME_CONFIG.BOUNCE;
            fruit2.vx = tempVx * GAME_CONFIG.BOUNCE;
            fruit2.vy = tempVy * GAME_CONFIG.BOUNCE;
        }
    }
    
    // バウンス効果を追加
    addBounceEffect(x, y) {
        // 簡単な視覚効果（実際の実装ではより複雑なエフェクトを追加可能）
        console.log(`合体！位置: (${x}, ${y})`);
    }
    
    // 描画処理
    draw() {
        const ctx = this.ctx;
        
        // 背景をクリア
        ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        
        // 背景グラデーション
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
        
        // フルーツを描画
        this.fruits.forEach(fruit => fruit.draw(ctx));
        
        // 落下予定位置の表示
        if (!this.gameOver) {
            const fruitType = FRUIT_TYPES[this.nextFruitType];
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(this.mouseX, 50, fruitType.size / 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.mouseX, 50, fruitType.size / 2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // スコア更新
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    // ゲームオーバー画面表示
    showGameOverScreen() {
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    // ゲーム再開
    restart() {
        this.fruits = [];
        this.score = 0;
        this.gameOver = false;
        this.updateScore();
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.generateNextFruit();
        this.gameLoop();
    }
}

// フルーツクラス
class Fruit {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.type = type;
        this.size = type.size;
        this.rotation = 0;
    }
    
    // フルーツの更新
    update() {
        // 重力を適用
        this.vy += GAME_CONFIG.GRAVITY;
        
        // 位置を更新
        this.x += this.vx;
        this.y += this.vy;
        
        // 摩擦を適用
        this.vx *= GAME_CONFIG.FRICTION;
        
        // 壁との衝突判定
        if (this.x - this.size / 2 < 0) {
            this.x = this.size / 2;
            this.vx *= -GAME_CONFIG.BOUNCE;
        }
        if (this.x + this.size / 2 > GAME_CONFIG.CANVAS_WIDTH) {
            this.x = GAME_CONFIG.CANVAS_WIDTH - this.size / 2;
            this.vx *= -GAME_CONFIG.BOUNCE;
        }
        
        // 底面との衝突判定
        if (this.y + this.size / 2 > GAME_CONFIG.CANVAS_HEIGHT) {
            this.y = GAME_CONFIG.CANVAS_HEIGHT - this.size / 2;
            this.vy *= -GAME_CONFIG.BOUNCE;
            this.vx *= GAME_CONFIG.FRICTION;
        }
        
        // 回転
        this.rotation += 0.1;
    }
    
    // フルーツの描画
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // フルーツの影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(2, this.size / 2 + 2, this.size / 2, this.size / 4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // フルーツ本体
        ctx.fillStyle = this.type.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // フルーツのハイライト
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(-this.size / 4, -this.size / 4, this.size / 6, 0, Math.PI * 2);
        ctx.fill();
        
        // フルーツの絵文字
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.emoji, 0, 0);
        
        ctx.restore();
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new GameState();
});
