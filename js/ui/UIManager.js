class UIManager {
    constructor() {
        this.elements = {
            trailCounter: document.getElementById('trailCounter'),
            grassBent: document.getElementById('grassBent'),
            visibility: document.getElementById('visibility')
        };
    }
    
    updateTrailCounter(count) {
        this.elements.trailCounter.innerHTML = 
            `Следов оставлено: <span style="color: #9acd32">${count}</span>`;
    }
    
    updateGrassBent(count) {
        this.elements.grassBent.innerHTML = 
            `Примято травы: <span style="color: #9acd32">${count}</span>`;
    }
    
    updateVisibility(level) {
        let text, color;
        
        switch(level) {
            case 'LOW':
                text = "НИЗКАЯ";
                color = "#32cd32";
                break;
            case 'MEDIUM':
                text = "СРЕДНЯЯ";
                color = "#ffd700";
                break;
            case 'HIGH':
                text = "ВЫСОКАЯ";
                color = "#ff4500";
                break;
        }
        
        this.elements.visibility.innerHTML = 
            `Заметность: <span style="color: ${color}">${text}</span>`;
    }

    showAlert(message, type = 'warning') {
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: absolute;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'warning' ? '#ff4444' : '#4a9c5a'};
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: fadeInOut 3s ease-in-out;
        `;
        alertDiv.textContent = message;
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            document.body.removeChild(alertDiv);
        }, 3000);
    }
}