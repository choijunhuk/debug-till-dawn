import Phaser from 'phaser';
import { MetaProgress } from '../systems/MetaProgress';
import { brandAssets } from '../data/brandAssets';
import { ENEMIES } from '../data/enemies';
import { drawEnemyShape, shapeSize } from '../data/enemyVisuals';
// 코드 생성 도형 텍스처. 실제 로고는 assets/logos + brandAssets 로 교체(13번).
export class PreloadScene extends Phaser.Scene {
    constructor() { super('Preload'); }
    preload() {
        this.circle('player', 16, 0xffffff);
        this.circle('enemy', 16, 0xffffff);
        this.circle('orb', 8, 0xffffff);
        this.circle('minion', 9, 0x7ee787);
        this.circle('icondot', 12, 0xffffff);
        this.rect('proj', 12, 6, 0xffffff);
        this.rect('gem', 10, 10, 0x6a9955);
        this.rect('coffee', 14, 14, 0x6f4e37);
        this.rect('bomb', 16, 16, 0xff3333);
        this.rect('magnetItem', 14, 14, 0x58a6ff);
        this.grid('grid', 64, 0x161b22);
        this.scanline('scanline'); // 스캔라인 타일
        this.vignette('vignette'); // 가장자리 비네팅
        // 적 절차적 모양 → 텍스처 캐싱(같은 종류 수백 마리 재사용, 성능 핵심).
        for (const def of Object.values(ENEMIES)) {
            if (!def.shape)
                continue;
            const sz = shapeSize(def.shape);
            const g = this.add.graphics();
            drawEnemyShape(g, def.shape);
            g.generateTexture(`eshape_${def.id}`, sz, sz);
            g.destroy();
        }
    }
    create() {
        MetaProgress.load();
        // 로고 래스터화 끝난 뒤 Menu 시작. 실패해도 진행(도형 fallback).
        this.loadLogos().then(() => this.scene.start('Menu'));
    }
    // simple-icons SVG → 흰색 실루엣 canvas 텍스처. Phaser SVGFile 로더가 data URI 에 까다로워
    // 직접 Image+canvas 로 래스터화(색은 use site 에서 setTint).
    loadLogos() {
        const tasks = Object.entries(brandAssets).map(([key, brand]) => new Promise((res) => {
            const svg = brand.svg.replace('<svg', '<svg fill="#ffffff"');
            const img = new Image();
            img.onload = () => {
                const c = document.createElement('canvas');
                c.width = 64;
                c.height = 64;
                c.getContext('2d').drawImage(img, 0, 0, 64, 64);
                if (this.textures.exists(`logo_${key}`))
                    this.textures.remove(`logo_${key}`);
                this.textures.addCanvas(`logo_${key}`, c);
                res();
            };
            img.onerror = () => res();
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
        }));
        return Promise.all(tasks).then(() => undefined);
    }
    circle(key, r, color) {
        const g = this.add.graphics();
        g.fillStyle(color).fillCircle(r, r, r);
        g.generateTexture(key, r * 2, r * 2);
        g.destroy();
    }
    rect(key, w, h, color) {
        const g = this.add.graphics();
        g.fillStyle(color).fillRect(0, 0, w, h);
        g.generateTexture(key, w, h);
        g.destroy();
    }
    grid(key, size, color) {
        const g = this.add.graphics();
        g.lineStyle(1, color, 1).strokeRect(0, 0, size, size);
        g.generateTexture(key, size, size);
        g.destroy();
    }
    // 4x4 타일: 윗줄만 어둡게 → 타일링하면 가로 스캔라인
    scanline(key) {
        const g = this.add.graphics();
        g.fillStyle(0x000000, 1).fillRect(0, 0, 4, 1);
        g.generateTexture(key, 4, 4);
        g.destroy();
    }
    // 방사형 그라데이션(중앙 투명 → 가장자리 검정) 비네팅. canvas 직접.
    vignette(key) {
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        const ctx = c.getContext('2d');
        const grad = ctx.createRadialGradient(128, 128, 50, 128, 128, 185);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);
        if (this.textures.exists(key))
            this.textures.remove(key);
        this.textures.addCanvas(key, c);
    }
}
