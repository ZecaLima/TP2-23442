import Phaser from 'phaser';
import { sharedInstance as events} from './EventCenter';

export default class UI extends Phaser.Scene
{   
    private coinLabel!: Phaser.GameObjects.Text
    private coinsCollected = 0
    private graphics!: Phaser.GameObjects.Graphics

    private lastHeatlh = 10

    constructor()
    {
        super({
            key: 'ui'
        })
    }
    
    init()
    {
        this.coinsCollected = 0
        this.lastHeatlh = 10
    }

    create()
    {
        this.graphics = this.add.graphics()
        this.setHealthBar(10)

        this.coinLabel = this.add.text(10, 30, 'Coins: 0 /20', {
            fontSize: '12px',
        })

        events.on('coin-collected', this.handleCoinCollected, this)
        events.on('health-changed', this.handleHealthChanged, this)

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            events.off('coin-collected', this.handleCoinCollected, this)
        })
    }

    private setHealthBar(value: number)
    {
        const width = 100
        const percent = Phaser.Math.Clamp(value*10, 0, 100) / width

        this.graphics.clear()
        this.graphics.fillStyle(0x808080)
        this.graphics.fillRoundedRect(10, 10, width, 15, 5)

        if(percent > 0)
        {   
            if(percent <= 0.3)
            {
                this.graphics.fillStyle(0xff0000)
            }
            if(percent > 0.3 && percent <= 0.6)
            {
                this.graphics.fillStyle(0xffcc00)
            }
            if(percent > 0.6)
            {
                this.graphics.fillStyle(0x00ff00)
            }
            this.graphics.fillRoundedRect(10, 10, width * percent, 15, 5)
        }
    }

    private handleHealthChanged(value: number)
    {
        this.tweens.addCounter({
            from: this.lastHeatlh,
            to: value,
            duration: 200,
            onUpdate: tween => {
                const value = tween.getValue()
                this.setHealthBar(value)
            }
        })
        
        this.lastHeatlh = value
    }

    private handleCoinCollected(value: number)
    {
        this.coinLabel.text = `Coins: ${value} /20`
    }
}