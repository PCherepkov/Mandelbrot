class Comp {
  constructor (re, im) {
    this.re = re
    this.im = im
  }
}

function Sqr (z) {
  const nre = z.re * z.re - z.im * z.im
  const nim = z.re * z.im * 2
  const nz = new Comp(nre, nim)
  return nz
}

function Sum (z1, z2) {
  const nre = z1.re + z2.re
  const nim = z1.im + z2.im
  const z = new Comp(nre, nim)
  return z
}

function Color (z0) {
  let max = 200
  let color = 0
  let z = z0

  while (max >= 0 && z.re * z.re + z.im * z.im <= 4) {
    z = Sqr(z)
    z = Sum(z, z0)
    color++
    max--
  }
  return color
}

function Mand (context, w, h) {
  const zmin = new Comp(-1.8, -0.9)
  const z0 = new Comp(zmin.re, zmin.im)

  for (let y = 0; y < h - 1; y++) {
    z0.im = zmin.im + (y - h * 0.17) / h * 3
    for (let x = 0; x < w - 1; x++) {
      z0.re = zmin.re + x / w * 3
      const color = Color(z0)
      const b = 0
      context.fillStyle = 'rgb(' + color + ',' + color + ',' + b + ')'
      context.fillRect(x, y, x + 1, y + 1)
    }
  }
}

function helloMessage () {
  alert('hello!')
}
