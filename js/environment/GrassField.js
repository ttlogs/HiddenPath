class GrassField {
    constructor(size = 40, density = 8000) {
        this.size = size;
        this.density = density;
        this.group = new THREE.Group();
        this.grassBlades = [];
        this.bentBlades = new Set();

        // Храним позиции всех активных игроков
        this.activePlayers = new Map(); // playerId -> { position, lastUpdate }

        // Visibility cone configuration
        this.visibilityConfig = {
            coneAngle: Math.PI * 0.75,      // 135° total cone (67.5° each side)
            fadeAngle: Math.PI * 0.25,      // 45° fade zone
            maxDistance: 25,                 // Max visibility distance
            minDistance: 3                   // Full visibility min distance
        };

        this.generate();
    }

    generate() {
        for (let i = 0; i < this.density; i++) {
            const grassBlade = new GrassBlade();

            grassBlade.setPosition(
                (Math.random() - 0.5) * this.size,
                1.25,
                (Math.random() - 0.5) * this.size
            );

            this.grassBlades.push(grassBlade);
            this.group.add(grassBlade.getMesh());
        }

        console.log(`✅ Создано ${this.grassBlades.length} травинок`);
    }

    // Добавляем/обновляем позицию игрока
    updatePlayerPosition(playerId, position) {
        // Преобразуем объект position в THREE.Vector3 если нужно
        let vectorPosition;

        if (position instanceof THREE.Vector3) {
            vectorPosition = position.clone();
        } else if (position && typeof position.x === 'number' && typeof position.z === 'number') {
            // Если это обычный объект {x, y, z}
            vectorPosition = new THREE.Vector3(
                position.x || 0,
                position.y || 0.2, // значение по умолчанию для y
                position.z || 0
            );
        } else {
            console.warn('⚠️ Некорректная позиция для игрока:', playerId, position);
            return;
        }

        this.activePlayers.set(playerId, {
            position: vectorPosition,
            lastUpdate: Date.now()
        });
    }

    // Удаляем игрока
    removePlayer(playerId) {
        this.activePlayers.delete(playerId);
    }

    // Очищаем неактивных игроков
    cleanupInactivePlayers(maxInactiveTime = 5000) {
        const now = Date.now();
        this.activePlayers.forEach((data, playerId) => {
            if (now - data.lastUpdate > maxInactiveTime) {
                this.activePlayers.delete(playerId);
                console.log(`🧹 Удален неактивный игрок из системы травы: ${playerId}`);
            }
        });
    }

    // Приминаем траву вокруг всех активных игроков
    bendGrassAroundAllPlayers() {
        let totalBent = 0;
        let freshBent = 0;

        // Очищаем неактивных игроков
        this.cleanupInactivePlayers();

        // Обрабатываем каждого активного игрока
        this.activePlayers.forEach((playerData, playerId) => {
            const result = this.bendGrassAroundPosition(playerData.position, 1.8);
            totalBent += result.total;
            freshBent += result.fresh;
        });

        return {
            total: totalBent,
            fresh: freshBent
        };
    }

    // Приминаем траву вокруг конкретной позиции
    bendGrassAroundPosition(position, radius = 1.8) {
        let totalBent = 0;
        let freshBent = 0;

        // Убеждаемся, что position - это THREE.Vector3
        const vectorPosition = position instanceof THREE.Vector3
        ? position
        : new THREE.Vector3(position.x || 0, position.y || 0, position.z || 0);

        this.grassBlades.forEach(grassBlade => {
            const bladePos = grassBlade.getMesh().position;
            const distance = new THREE.Vector2(bladePos.x, bladePos.z)
                .distanceTo(new THREE.Vector2(vectorPosition.x, vectorPosition.z));

            if (distance < radius) {
                if (!grassBlade.isBent()) {
                    const direction = new THREE.Vector3()
                        .subVectors(bladePos, vectorPosition)
                        .normalize();

                    if (grassBlade.bend(direction)) {
                        this.bentBlades.add(grassBlade);
                        totalBent++;
                        freshBent++;
                    }
                } else {
                    totalBent++;
                }
            }
        });

        return {
            total: totalBent,
            fresh: freshBent
        };
    }

    // Старый метод для обратной совместимости
    bendGrassAround(position, radius = 1.8) {
        return this.bendGrassAroundPosition(position, radius);
    }

    restoreGrass() {
        let restoredCount = 0;

        this.bentBlades.forEach(grassBlade => {
            if (grassBlade.restore()) {
                this.bentBlades.delete(grassBlade);
                restoredCount++;
            }
        });

        return restoredCount;
    }

    animateWind() {
        const time = Date.now();
        this.grassBlades.forEach(grassBlade => {
            grassBlade.animateWind(time);
        });
    }

    getGroup() {
        return this.group;
    }

    getBentCount() {
        return this.bentBlades.size;
    }

    // Для отладки - информация об активных игроках
    getDebugInfo() {
        return {
            totalPlayers: this.activePlayers.size,
            bentGrass: this.bentBlades.size,
            players: Array.from(this.activePlayers.entries()).map(([id, data]) => ({
                id: id.substr(0, 8),
                position: data.position,
                lastUpdate: new Date(data.lastUpdate).toLocaleTimeString()
            }))
        };
    }

    // Update grass visibility based on player facing direction
    updateVisibility(playerPosition, playerFacingAngle) {
        const config = this.visibilityConfig;

        for (const blade of this.grassBlades) {
            const bladePos = blade.mesh.position;

            // Vector from player to blade
            const dx = bladePos.x - playerPosition.x;
            const dz = bladePos.z - playerPosition.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // Distance-based visibility
            if (distance > config.maxDistance) {
                blade.mesh.material.opacity = 0;
                continue;
            }

            // Angle from player facing direction
            const bladeAngle = Math.atan2(dx, dz);
            let angleDiff = Math.abs(bladeAngle - playerFacingAngle);

            // Normalize to 0-PI range
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

            // Calculate opacity
            const halfCone = config.coneAngle / 2;
            const fadeStart = halfCone - config.fadeAngle;

            if (angleDiff > halfCone) {
                // Outside cone - invisible
                blade.mesh.material.opacity = 0;
            } else if (angleDiff > fadeStart) {
                // Fade zone - gradient
                const fadeProgress = (angleDiff - fadeStart) / config.fadeAngle;
                blade.mesh.material.opacity = 1 - fadeProgress;
            } else {
                // Inside cone - fully visible
                blade.mesh.material.opacity = 1;
            }

            // Distance fade for far grass
            if (distance > config.minDistance) {
                const distFade = 1 - (distance - config.minDistance) / (config.maxDistance - config.minDistance);
                blade.mesh.material.opacity *= Math.max(0, distFade);
            }
        }
    }
}