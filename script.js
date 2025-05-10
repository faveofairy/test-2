const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let cards = [];
let draggingCard = null;
let draggingCanvas = false;
let offsetX = 0;
let offsetY = 0;
let panX = 0;
let panY = 0;
let zoom = 1;

const backgroundImage = new Image();
backgroundImage.src = 'images/background.jpg';

function drawCards() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(zoom, 0, 0, zoom, panX, panY);

    cards.forEach(card => {
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(card.x, card.y, 100, 50);
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let fontSize = 16;
        const maxWidth = 90;
        ctx.font = `${fontSize}px Arial`;
        while (ctx.measureText(card.text).width > maxWidth && fontSize > 8) {
            fontSize -= 1;
            ctx.font = `${fontSize}px Arial`;
        }

        ctx.fillText(card.text, card.x + 50, card.y + 25);
    });
}

function getTransformedPos(x, y) {
    return {
        x: (x - panX) / zoom,
        y: (y - panY) / zoom
    };
}

function getCardAt(x, y) {
    for (let i = cards.length - 1; i >= 0; i--) {
        const card = cards[i];
        if (x >= card.x && x <= card.x + 100 && y >= card.y && y <= card.y + 50) {
            return card;
        }
    }
    return null;
}

// --- Maussteuerung
canvas.addEventListener('mousedown', (e) => {
    const { x, y } = getTransformedPos(e.clientX, e.clientY);
    const clickedCard = getCardAt(x, y);

    if (clickedCard) {
        draggingCard = clickedCard;
        offsetX = x - clickedCard.x;
        offsetY = y - clickedCard.y;
    } else {
        draggingCanvas = true;
        offsetX = e.clientX - panX;
        offsetY = e.clientY - panY;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (draggingCard) {
        const { x, y } = getTransformedPos(e.clientX, e.clientY);
        draggingCard.x = x - offsetX;
        draggingCard.y = y - offsetY;
        drawCards();
    } else if (draggingCanvas) {
        panX = e.clientX - offsetX;
        panY = e.clientY - offsetY;
        drawCards();
    }
});

canvas.addEventListener('mouseup', () => {
    draggingCard = null;
    draggingCanvas = false;
});

// --- Touchsteuerung
canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const clientX = touch.clientX - rect.left;
        const clientY = touch.clientY - rect.top;

        const { x, y } = getTransformedPos(clientX, clientY);
        const clickedCard = getCardAt(x, y);

        if (clickedCard) {
            draggingCard = clickedCard;
            offsetX = x - clickedCard.x;
            offsetY = y - clickedCard.y;
        } else {
            draggingCanvas = true;
            offsetX = clientX - panX;
            offsetY = clientY - panY;
        }
    }
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const clientX = touch.clientX - rect.left;
        const clientY = touch.clientY - rect.top;

        if (draggingCard) {
            const { x, y } = getTransformedPos(clientX, clientY);
            draggingCard.x = x - offsetX;
            draggingCard.y = y - offsetY;
            drawCards();
        } else if (draggingCanvas) {
            panX = clientX - offsetX;
            panY = clientY - offsetY;
            drawCards();
        }
    }
}, { passive: false });

canvas.addEventListener('touchend', () => {
    draggingCard = null;
    draggingCanvas = false;
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const { x, y } = getTransformedPos(e.clientX, e.clientY);
    const zoomFactor = 1.1;
    const direction = e.deltaY < 0 ? 1 : -1;
    const factor = direction > 0 ? zoomFactor : 1 / zoomFactor;

    const newZoom = zoom * factor;
    const dx = x * (newZoom - zoom);
    const dy = y * (newZoom - zoom);

    panX -= dx;
    panY -= dy;
    zoom = newZoom;

    drawCards();
}, { passive: false });

// Wörter laden
fetch('woerter.json')
    .then(response => response.json())
    .then(data => {
        for (let i = data.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [data[i], data[j]] = [data[j], data[i]];
        }

        const cardWidth = 100;
        const cardHeight = 50;
        const spacingX = 10;
        const spacingY = 10;
        const cardsPerStack = 28;
        const columns = 3;
        const rows = 3;

        const totalWidth = columns * cardWidth + (columns - 1) * spacingX;
        const totalHeight = rows * cardHeight + (rows - 1) * spacingY;

        const startX = (canvas.width - totalWidth) / 2;
        const startY = (canvas.height - totalHeight) / 2;

        setTimeout(() => {
            for (let col = 0; col < columns; col++) {
                for (let row = 0; row < rows; row++) {
                    const stackStartIndex = (row * columns + col) * cardsPerStack;
                    const stackWords = data.slice(stackStartIndex, stackStartIndex + cardsPerStack).reverse();

                    stackWords.forEach((word, index) => {
                        cards.push({
                            text: word,
                            x: startX + col * (cardWidth + spacingX),
                            y: startY + row * (cardHeight + spacingY),
                            zIndex: index
                        });
                    });
                }
            }
            drawCards();
        }, 500);

        backgroundImage.onload = () => drawCards();
    })
    .catch(err => console.error('Fehler beim Laden der Wörter:', err));

// Reset-Button
const resetButton = document.getElementById('reset-btn');
let holdTimeout;

function startReset() {
    resetButton.classList.add('holding');
    holdTimeout = setTimeout(() => location.reload(), 3000);
}

function cancelReset() {
    clearTimeout(holdTimeout);
    resetButton.classList.remove('holding');
}

resetButton.addEventListener('mousedown', startReset);
resetButton.addEventListener('mouseup', cancelReset);
resetButton.addEventListener('mouseleave', cancelReset);

// Touch für Reset
resetButton.addEventListener('touchstart', startReset);
resetButton.addEventListener('touchend', cancelReset);
