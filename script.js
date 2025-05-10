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

function getMouse(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left - panX) / zoom;
    const y = (clientY - rect.top - panY) / zoom;
    return { x, y };
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

// MOUSE + TOUCH EVENTS
function startDrag(e) {
    e.preventDefault();
    const { x, y } = getMouse(e);
    const clickedCard = getCardAt(x, y);
    if (clickedCard) {
        draggingCard = clickedCard;
        offsetX = x - clickedCard.x;
        offsetY = y - clickedCard.y;
    } else {
        draggingCanvas = true;
        offsetX = (e.touches ? e.touches[0].clientX : e.clientX) - panX;
        offsetY = (e.touches ? e.touches[0].clientY : e.clientY) - panY;
    }
}

function moveDrag(e) {
    if (draggingCard || draggingCanvas) e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (draggingCard) {
        const { x, y } = getMouse(e);
        draggingCard.x = x - offsetX;
        draggingCard.y = y - offsetY;
        drawCards();
    } else if (draggingCanvas) {
        panX = clientX - offsetX;
        panY = clientY - offsetY;
        drawCards();
    }
}

function endDrag() {
    draggingCard = null;
    draggingCanvas = false;
}

canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('mousemove', moveDrag);
canvas.addEventListener('mouseup', endDrag);
canvas.addEventListener('mouseleave', endDrag);

canvas.addEventListener('touchstart', startDrag, { passive: false });
canvas.addEventListener('touchmove', moveDrag, { passive: false });
canvas.addEventListener('touchend', endDrag);

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const { x, y } = getMouse(e);
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
        const offsetX = (canvas.width - totalWidth) / 2;
        const offsetY = (canvas.height - totalHeight) / 2;

        setTimeout(() => {
            for (let col = 0; col < columns; col++) {
                for (let row = 0; row < rows; row++) {
                    const stackStartIndex = (row * columns + col) * cardsPerStack;
                    const stackWords = data.slice(stackStartIndex, stackStartIndex + cardsPerStack).reverse();
                    stackWords.forEach((word, index) => {
                        cards.push({
                            text: word,
                            x: offsetX + col * (cardWidth + spacingX),
                            y: offsetY + row * (cardHeight + spacingY),
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

const resetButton = document.getElementById('reset-btn');
let holdTimeout;

resetButton.addEventListener('mousedown', () => {
    resetButton.classList.add('holding');
    holdTimeout = setTimeout(() => location.reload(), 3000);
});

resetButton.addEventListener('mouseup', () => {
    clearTimeout(holdTimeout);
    resetButton.classList.remove('holding');
});

resetButton.addEventListener('mouseleave', () => {
    clearTimeout(holdTimeout);
    resetButton.classList.remove('holding');
});
