import Phaser from "phaser";

export default class GameWin extends Phaser.Scene
{
    constructor()
    {
        super('game-win')
    }

    create()
    {
        const {width, height} = this.scale

        this.add.text(width * 0.5, height * 0.3, 'Game Won!!', {
            fontSize: '52px',
            color: '#00ff00'
        })
        .setOrigin(0.5)

        this.add.text(width * 0.5, height * 0.50, 'You have collected all coins from the Captain Treasure', {
            fontSize: '20px',
            color: '#ffffff',
            wordWrap: { width: width * 0.8, useAdvancedWrap: true },
            align: 'center'
        })
        .setOrigin(0.5)

        const button = this.add.rectangle(width * 0.5, height * 0.75, 100, 50, 0xffffff)
            .setInteractive()
            .once(Phaser.Input.Events.POINTER_UP, () => {
                this.scene.start('game')
            })

        this.add.text(button.x, button.y, 'Play Again', {
            color: '#000000',
        })
        .setOrigin(0.5)
    }
}