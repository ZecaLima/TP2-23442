import StateMachine from "~/statemachine/StateMachine"
import {sharedInstance as events} from './EventCenter'

export default class EnemyController
{
    private sprite: Phaser.Physics.Matter.Sprite
    private stateMachine: StateMachine

    private moveTime = 0

    constructor(sprite: Phaser.Physics.Matter.Sprite)
    {
        this.sprite = sprite

        this.CreateAnimations()

        this.stateMachine = new StateMachine(this, 'enemy')

        this.stateMachine.addState('idle', {
            onEnter: this.idleOnEnter
        })
        .addState('move-right', {
            onEnter: this.moveRightOnEnter,
            onUpdate: this.moveRightOnUpdate
        })
        .addState('move-left',{
            onEnter: this.moveLeftOnEnter,
            onUpdate: this.moveLeftOnUpdate
        })
        .addState('dead')
        .setState('idle')

        events.on('enemy-stomped', this.handleEnemyStomped, this)
    }

    destroy()
    {
        events.off('enemy-stomped', this.handleEnemyStomped, this)
    }

    update(dt: number)
    {
        this.stateMachine.update(dt)
    }

    private idleOnEnter()
    {

        const random = Phaser.Math.Between(0, 100)
        if(random < 50)
        {
            this.stateMachine.setState('move-left')
        }
        else
        {
            this.stateMachine.setState('move-right')
        }   
    }

    private moveLeftOnEnter()
    {
        this.moveTime = 0
        this.sprite.play('Enemy-Walk')
        this.sprite.setFlipX(false)
    }

    private moveLeftOnUpdate(dt: number)
    {
        this.moveTime += dt
        this.sprite.setVelocityX(-1)

        if(this.moveTime >= 2000)
        {
            this.stateMachine.setState('move-right')
        }
    }

    private moveRightOnEnter()
    {
        this.moveTime = 0
        this.sprite.play('Enemy-Walk')
        this.sprite.setFlipX(true)
    }

    private moveRightOnUpdate(dt: number)
    {
        this.moveTime += dt
        this.sprite.setVelocityX(1)

        if(this.moveTime >= 2000)
        {
            this.stateMachine.setState('move-left')
        }
    }

    private handleEnemyStomped(enemy: Phaser.Physics.Matter.Sprite)
    {
        if(this.sprite !== enemy)
        {
            return
        }
        
        events.off('enemy-stomped', this.handleEnemyStomped, this)
        
        this.sprite.play('Enemy-Dead')
        this.sprite.setCollidesWith(0)//faz o inimigo cair, pois fica num grupo de colisão vazio
        this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
            this.sprite.destroy()
        })
        
        this.stateMachine.setState('dead')
    }

    private CreateAnimations()
    {
        this.sprite.anims.create({
            key: 'Enemy-Idle',
            frameRate: 10,
            frames: this.sprite.anims.generateFrameNames('Enemy', {
                start: 1, 
                end: 8, 
                prefix: '01-Idle/Idle 0', 
                suffix: '.png'
            }),
            repeat: -1
        })

        this.sprite.anims.create({
            key: 'Enemy-Walk',
            frameRate: 10,
            frames: this.sprite.anims.generateFrameNames('Enemy', {
                start: 1, 
                end: 6, 
                prefix: '02-Run/Run 0', 
                suffix: '.png'
            }),
            repeat: -1
        })

        this.sprite.anims.create({
            key: 'Enemy-Dead',
            frameRate: 10,
            frames: this.sprite.anims.generateFrameNames('Enemy', {
                start: 1, 
                end: 4, 
                prefix: '09-Dead Hit/Dead Hit 0', 
                suffix: '.png'
            }),
            repeat: 1
        })
    }   
}