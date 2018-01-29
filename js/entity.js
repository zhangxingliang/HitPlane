function between(val, max, min = 0) {
  return Math.min(Math.max(val, min), max)
}

class Spirit {
  constructor(opt) {
    opt = Object.assign({
      src: '',
      width: 0,
      height: 0,
      x: 0,
      y: 0,
    }, opt)
    this.height = opt.height
    this.width = opt.width
    this.el = document.createElement('img')
    this.el.setAttribute('src', opt.src)
    this.loaded = false
    this.el.onload = () => {
      this.loaded = true
      if (!opt.width || opt.height) {
        this.height = this.el.naturalHeight
        this.width = this.el.naturalWidth
      }
      this.onready && this.onready.call(this)
    }
    this.x = opt.x
    this.y = opt.y
  }

  draw(ctx) {
    this.loaded && ctx.drawImage(this.el, this.x, this.y, this.width, this.height)
    return this.loaded
  }
}

class Plane extends Spirit {
  constructor(opt) {
    super(opt)
    this.stage = opt.stage
  }

  move(x, y) {
    this.x = between(x - this.width / 2, this.stage.clientWidth - this.width, 0)
    this.y = between(y - this.height / 2, this.stage.clientHeight - this.height, 0)
  }

}

class Bullet extends Spirit {
  constructor(opt) {
    super(opt)
    this.stage = opt.stage
    this.active = false
    this.level = 1
  }

  move() {
    if (this.y > 0) {
      this.y -= 5 + this.level
    } else {
      this.y = -1
      this.active = false
    }
  }

  emit(x, y) {
    this.x = x
    this.y = y
    this.active = true
  }
}

class Enemy extends Spirit {
  constructor(opt) {
    super(opt)
    this.stage = opt.stage
    this.x = (this.stage.width - this.width) * Math.random()
    this.active = false
    this.level = 1
  }

  lauch() {
    this.x = (this.stage.width - this.width) * Math.random()
    this.y = -1 * this.height
    this.active = true
  }

  move() {
    if (this.y < this.stage.clientHeight) {
      this.y += 1 + 0.1 * this.level
    } else {
      this.y = -1 * this.height
      this.active = false
    }
  }
}

class Game {
  constructor(el) {
    if (!el) {
      el = document.createElement('canvas')
      el.width = 450
      el.height = 800
      document.body.appendChild(el)
    }
    this.stage = el
    this.context = el.getContext("2d")
    this.context.font = "20px Ariel";
    this.bg = document.createElement('img')
    this.bg.setAttribute('src', './source/back.jpg')
    this.bg.onload = () => {
      this.offlineCtx.drawImage(this.bg, 0, 0, 450, 800)
    }
    this.offlineCanvas = document.createElement('canvas')
    this.offlineCanvas.width = 450
    this.offlineCanvas.height = 800
    this.offlineCtx = this.offlineCanvas.getContext("2d");
    // this.bulletList = []
    // this.bulletList.push(new Bullet({
    //   src: './source/bullet.png',
    //   stage: this.stage
    // }))
    // this.enemyList = []
    // this.enemyList.push(new Enemy({
    //   src: './source/enemy.png',
    //   stage: this.stage
    // }))
    // this.enemyList.push(new Enemy({
    //   src: './source/enemy.png',
    //   stage: this.stage
    // }))
    // this.enemyList.push(new Enemy({
    //   src: './source/enemy.png',
    //   stage: this.stage
    // }))
    this.plane = new Plane({
      src: './source/plane.png',
      stage: this.stage
    })
    this.plane.onready = () => {
      this.plane.draw(this.offlineCtx)
      this.draw()
    }
    this.score = 0
    this.isOver = true
  }

  draw() {
    this.context.clearRect(0, 0, 450, 800)
    this.context.drawImage(this.offlineCanvas, 0, 0, 450, 800)
    this.isOver ? this.context.fillText('Game OVer:' + this.score, 150, 350) : this.context.fillText('score:' + this.score, 50, 50)
  }

  planeMove(event) {
    this.plane.move(event.x, event.y)
  }

  levelUp(level) {
    if (this.bulletList.length < level) {
      this.bulletList.push(new Bullet({
        src: './source/bullet.png',
        stage: this.stage
      }))
    }
    if (this.bulletList.length < level * 5) {
      this.enemyList.push(new Enemy({
        src: './source/enemy.png',
        stage: this.stage
      }))
    }
  }

  start() {
    this.score = 0
    this.bulletList = []
    this.bulletList.push(new Bullet({
      src: './source/bullet.png',
      stage: this.stage
    }))
    this.enemyList = []
    this.enemyList.push(new Enemy({
      src: './source/enemy.png',
      stage: this.stage
    }))
    this.levelUp(1)
    this.isOver = false
    window.addEventListener("mousemove", this.planeMove.bind(this), false)
    this.calc = () => {
      this.offlineCtx.clearRect(0, 0, 450, 800)
      this.offlineCtx.drawImage(this.bg, 0, 0, 450, 800)
      this.plane.draw(this.offlineCtx)
      this.bulletList.filter(item => item.active).forEach((item, index) => {
        this.enemyList.filter(item => item.active).forEach((i, idx) => {
          if (item.active && i.x < item.x && i.x + i.width > item.x && i.y < item.y && i.y + i.height > item.y) {
            i.active = item.active = false
            this.score++
            var level = Math.ceil((this.score + 1) / 20)
            if (level !== i.level) {
              i.level = level
              item.level = level
              this.levelUp(level)
            }
            return
          } //
          if (i.x < this.plane.x && i.x + i.width > this.plane.x && i.y < this.plane.y && i.y + i.height > this.plane.y || i.x < this.plane.x + 0.7 * this.plane.height && i.x + i.width > this.plane.x + 0.7 * this.plane.width && i.y < this.plane.y && i.y + i.height > this.plane.y || i.x < this.plane.x + 0.7 * this.plane.width && i.x + i.width > this.plane.x + 0.7 * this.plane.width && i.y < (this.plane.y + 0.3 * this.plane.height) && i.y + i.height > (this.plane.y + 0.3 * this.plane.height) || i.x < this.plane.x && i.x + i.width > this.plane.x && i.y < (this.plane.y + 0.3 * this.plane.height) && i.y + i.height > (this.plane.y + 0.3 * this.plane.height)) {
            i.active && this.stop()
          }
          i.active ? (i.move(), i.draw(this.offlineCtx)) : setTimeout(() => i.lauch(), idx * 1000)
        })
        item.active ? (item.move(), item.draw(this.offlineCtx)) : setTimeout(() => item.emit(this.plane.x + this.plane.width / 2, this.plane.y), index * 100)
      })
      this.bulletList.filter(item => !item.active).forEach((item, index) => {
        this.enemyList.filter(item => !item.active).forEach((i, idx) => {
          setTimeout(() => i.lauch(), idx * 1000)
        })
        setTimeout(() => item.emit(this.plane.x + this.plane.width / 2, this.plane.y), index * 100)
      })
      this.draw()
      requestAnimationFrame(this.calc)
    }
    this.calc()
  }

  stop() {
    this.isOver = true
    window.removeEventListener("mousemove", this.planeMove, false)
    this.calc = () => {
      return null
    }
  }

}
