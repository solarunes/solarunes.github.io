
//
//
//
// LIBRARIES --> PROGRAM 			PROGRAM LEVEL
// 					|
// 				 PLATFORM			ADJACENT LOWER LEVEL
//
//
//
// 	APIS   -->	PROGRAM
// 	  | 		   |
// 	{ SET OF PLATFORMS }
//
//
//


async function test() {

	let wasm = await ((await fetch("test.wasm")).arrayBuffer());

	const mod = await WebAssembly.instantiate(wasm, {env: {log: function(str) {console.log(str)}}});
	console.log(mod.instance.exports.add(1,2))

}

test();







const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

canvas.style.width = 100 + "vw";
canvas.style.height = 100 + "vh";
canvas.style.background = "black";

document.documentElement.style.overflow = "hidden";

function RESIZE_HANDLER() {
	canvas.width = innerWidth;
	canvas.height = innerHeight;
}

let STOP = 0;

const draw_array = [];
const FPS = 1000 / 60;

function draw() {
	ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
	ctx.fillRect(0, 0, innerWidth, innerHeight);
	ctx.fillStyle = "black";
	for (let i = 0; i < draw_array.length; i++) {
		draw_array[i].draw();
	}

	if (!STOP) setTimeout(draw, FPS);
}

const update_array = [];
const TPS = 1000 / 60;

function update() {
	for (let i = 0; i < update_array.length; i++) {
		update_array[i].update();
	}

	if (!STOP) setTimeout(update, TPS);
}

function togglePause(e) {
	if (e.which !== 32) return;

	STOP = 1 - STOP;
	if (!STOP) {
		update();
		draw();
	}
}

let dID = 0;
let uID = 0;

function addGameObject(obj) {
	draw_array.push(obj);
	update_array.push(obj);

	return [dID++, uID++];
}

function removeGameObject(idlist) {
	for (let i = 0; i < draw_array.length; i++) {
		if (draw_array[i].id[0] == idlist[0] && draw_array[i].id[1] == idlist[1]) draw_array.splice(i, 1);
	}
	for (let i = 0; i < update_array.length; i++) {
		if (update_array[i].id[0] == idlist[0] && update_array[i].id[1] == idlist[1]) update_array.splice(i, 1);
	}
}



function createBouncingBall(e) {
	const ball = {
		x: e.clientX,
		y: e.clientY,
		r: Math.trunc(Math.random() * 10) + 5,
		m: 0,
		color: `rgba(${Math.trunc(Math.random() * 256)}, ${Math.trunc(Math.random() * 256)}, ${Math.trunc(Math.random() * 256)}, ${0.5 + Math.trunc(Math.random() * 50) / 100})`,
		vx: Math.random() * 10 - 5,
		vy: Math.random() * 10 - 5,
		draw() {
			ctx.beginPath();
			ctx.fillStyle = this.color;
			ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
			ctx.fill();
			ctx.fillStyle = "black";
		},
		drawConnection(x, y) {
			ctx.strokeStyle = this.color;
			ctx.beginPath();
			ctx.moveTo(this.x, this.y);
			ctx.lineTo(x, y);
			ctx.stroke();
			ctx.strokeStyle = "black";
		},
		update() {
			if (this.x - this.r <= 0) {
				this.x = this.r;
				this.vx *= -1;
			} else if (this.x + this.r >= innerWidth) {
				this.x = innerWidth - this.r;
				this.vx *= -1;
			}
			if (this.y - this.r <= 0) {
				this.y = this.r;
				this.vy *= -1;
			} else if (this.y + this.r >= innerHeight) {
				this.y = innerHeight - this.r;
				this.vy *= -1;
			}

			for (let i = 0; i < update_array.length; i++) {
				let obj = update_array[i];
				if (obj.id[0] === this.id[0]) continue;
				let dx = this.x - obj.x;
				let dy = this.y - obj.y;
				let d = Math.hypot(dx, dy);
				let d_allowed = this.r + obj.r;
				if (d <= d_allowed) {
					let m = (d_allowed - d) / (d_allowed);
					this.x += dx * m * obj.r / (this.r + obj.r);
					this.y += dy * m * obj.r / (this.r + obj.r);
					obj.x -= dx * m * this.r / (this.r + obj.r);
					obj.y -= dy * m * this.r / (this.r + obj.r);
					dx = (Math.abs(dx) + Math.abs(dx * 2 * m)) * Math.sign(dx);
					dy = (Math.abs(dy) + Math.abs(dy * 2 * m)) * Math.sign(dy);
					let v1_f = (this.vx * -dx + this.vy * -dy) / Math.hypot(dx, dy);
					let v1_x = v1_f * -dx / Math.hypot(dx, dy);
					let v1_y = v1_f * -dy / Math.hypot(dx, dy);
					let v2_f = (obj.vx * dx + obj.vy * dy) / Math.hypot(dx, dy);
					let v2_x = v2_f * dx / Math.hypot(dx, dy);
					let v2_y = v2_f * dy / Math.hypot(dx, dy);
					this.vx += ((this.m - obj.m) * v1_x + 2 * obj.m * v2_x) / (this.m + obj.m) - v1_x;
					this.vy += ((this.m - obj.m) * v1_y + 2 * obj.m * v2_y) / (this.m + obj.m) - v1_y;
					obj.vx += ((obj.m - this.m) * v2_x + 2 * this.m * v1_x) / (this.m + obj.m) - v2_x;
					obj.vy += ((obj.m - this.m) * v2_y + 2 * this.m * v1_y) / (this.m + obj.m) - v2_y;
				} else if (d <= this.r * 10) {
					this.drawConnection(obj.x, obj.y);
				}
			}

			this.x += this.vx;
			this.y += this.vy;
		}
	};

	ball.m = ball.r ** 2 * Math.PI;
	ball.id = addGameObject(ball);
}

function deleteBouncingBall(e) {
	e.preventDefault();

	const x = e.clientX, y = e.clientY;

	for (let i = 0; i < draw_array.length; i++) {
		let obj = draw_array[i];

		if (x > obj.x - obj.r && x < obj.x + obj.r && y > obj.y - obj.r && y < obj.y + obj.r) {
			removeGameObject(obj.id);
			console.log(obj)
		}
	}

}



window._start = function() {
	window.addEventListener("resize", RESIZE_HANDLER);
	window.addEventListener("click", createBouncingBall);
	window.addEventListener("keydown", togglePause);
	window.addEventListener("contextmenu", deleteBouncingBall);
	window.addEventListener("wheel", _end);

	document.body.appendChild(canvas);

	RESIZE_HANDLER();

	update();
	draw();

	for (let i = 0; i < 30; i++) {
		createBouncingBall({clientX: Math.trunc(Math.random() * innerWidth), clientY: Math.trunc(Math.random() * innerHeight)})
	}
}


window._end = function() {
	STOP = 1;

	document.body.removeChild(canvas);

	window.removeEventListener("resize", RESIZE_HANDLER);
	window.removeEventListener("click", createBouncingBall);
	window.removeEventListener("keydown", togglePause);
	window.removeEventListener("contextmenu", deleteBouncingBall);
	window.removeEventListener("wheel", _end);
}

_start();

