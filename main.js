const OFFSET_X = 400;
const OFFSET_Y = 400;
const GLOBAL_SCALE = 0.01;

const GRAVITY = 9.81 * 5;

const OBJ_MIN_RADIUS = 1000;

const CONTAINER_RADIUS = 30000;
const CONTAINER_WIGGLE_MAG = 4000;
const CONTAINER_WIGGLE_SPEED = 0.5;

const SPAWN_AREA = 500;

const RATIO = 0.10;

let canvas;
let context;

let frameCount = 0;

let container;
let objects = [];

function handleLoaded() {
    canvas = document.getElementById("canvas");

    canvas.onclick = function() {
        canvas.requestFullscreen();
    }

    canvas.focus();

    context = canvas.getContext('2d');
    init();
    handleMotionTypeChanged();

    requestAnimationFrame(updateFrame);
}

function init() {

    objects = [];

    // container config
    let containerSize = document.getElementById("containerSize").value / 50 * CONTAINER_RADIUS;

    // content config
    let ratio = document.getElementById("ratio").value / 100;
    let quantity = document.getElementById("quantity").value;
    let smallSize = document.getElementById("smallSize").value / 25 * OBJ_MIN_RADIUS;
    let bigSize = document.getElementById("bigSize").value / 25 * OBJ_MIN_RADIUS;

    container = new CircleContainer(0, 0, containerSize, "blue", CONTAINER_WIGGLE_MAG, CONTAINER_WIGGLE_SPEED);

    for(let i = 0; i < quantity; i++) {
        
        let makeBigger = i < quantity * ratio;

        let size = makeBigger ? bigSize : smallSize;
        let object = new CicleObject((Math.random() * 2 - 1) * SPAWN_AREA, 
                                      (Math.random() * 2 - 1) * SPAWN_AREA, 
                                      size, 
                                      makeBigger ? "red" : "green");

        objects.push(object);
    }
}

function handleMotionTypeChanged() {
    let motionType = document.getElementById("motionType").value;

    container.motionType = parseInt(motionType);
}

// Dot product between two vectors
function dotProduct(vec1, vec2) {
    return vec1[0]*vec2[0] + vec1[1]*vec2[1];
}

// Magnitude of a Vector
function magnitude(v) {
    return Math.sqrt(magnitudeSquared(v));
}

// The magnitude before the square root takes place
function magnitudeSquared(v) {
    return v[0]*v[0] + v[1]*v[1];
}

// Gets the normalized vector from a vector
function normalized(v) {
    let mag = magnitude(v);
    return [
        v[0] / mag,
        v[1] / mag
    ];
}

// Update and draw a frame
function updateFrame() {

    context.clearRect(0, 0, 800, 800);

    container.update();

    for(let obj of objects) {
        obj.update();
    }

    for(let obj of objects) {
        obj.applyVelocity();
    }

    container.render();

    for(let obj of objects) {
        obj.render();
    }

    frameCount++;

    requestAnimationFrame(updateFrame);
    
}

// Base class for circles objects
class CircleCollider {

    constructor(x, y, radius, color) {
        this.radius = radius;
        this.x = x;
        this.y = y;
        this.color = color;
    }

    render() {
        context.strokeStyle = this.color;
        context.beginPath();
        context.moveTo((this.x + this.radius) * GLOBAL_SCALE + OFFSET_X, this.y * GLOBAL_SCALE + OFFSET_Y);
        context.arc(this.x * GLOBAL_SCALE + OFFSET_X, this.y * GLOBAL_SCALE + OFFSET_Y, this.radius * GLOBAL_SCALE, 0, 20);
        context.stroke();

        if(this instanceof CicleObject) {
            context.strokeStyle = "green";
            context.beginPath();
            context.moveTo(this.x * GLOBAL_SCALE + OFFSET_X, this.y * GLOBAL_SCALE + OFFSET_Y);

            let velocityNormal = Math.sqrt(this.velocity[0]*this.velocity[0] + this.velocity[1]*this.velocity[1]);

            let radiusOverVelocityNormal = this.radius / velocityNormal;

            context.lineTo((this.velocity[0] * radiusOverVelocityNormal + this.x) * GLOBAL_SCALE + OFFSET_X, 
                           (this.velocity[1] * radiusOverVelocityNormal + this.y) * GLOBAL_SCALE + OFFSET_Y);
            context.stroke();
        }
    }

    // Test for intesections between this and another collider
    intersectsWith(anotherCollider) {

        let delta = [
            this.x - anotherCollider.x, 
            this.y - anotherCollider.y
        ];

        let dist = magnitudeSquared(delta);
        let r = this.radius + anotherCollider.radius;
        
        return dist < r*r;
    }

    // Test if this collider is completelly inside another collider
    unionsWith(anotherCollider) {
        let delta = [
            this.x - anotherCollider.x,
            this.y - anotherCollider.y
        ];
        let r = anotherCollider.radius - this.radius;

        let mag = magnitudeSquared(delta);
        
        return mag < r*r;
    }

    // Vector point away from another collider
    awayVector(anotherCollider) {
        if(!anotherCollider instanceof CircleCollider) {
            return [0, 0];
        }

        let delta = [
            this.x - anotherCollider.x,
            this.y - anotherCollider.y
        ];

        let mag = magnitude(delta);

        return [
            delta[0] / mag * anotherCollider.radius,
            delta[1] / mag * anotherCollider.radius
        ]
    }
}

// The big container for all the smaller circles
class CircleContainer extends CircleCollider {
    
    constructor(x, y, radius, color, wiggleMagnitude, wiggleSpeed) {
        super(x, y, radius, color);

        this.originalX = x;
        this.originalY = y;
        this.wiggleMagnitude = wiggleMagnitude;
        this.wiggleSpeed = wiggleSpeed;

        this.motionType = 0;
    }

    update() {

        if(this.motionType === 1) {
            this.y = this.originalY - Math.sin(frameCount / Math.PI * this.wiggleSpeed) * this.wiggleMagnitude;
        }
        if(this.motionType === 2) {
            this.y = this.originalY + Math.sin(frameCount / Math.PI * this.wiggleSpeed) * this.wiggleMagnitude;
            this.x = this.originalX + Math.sin(frameCount / Math.PI * this.wiggleSpeed) * this.wiggleMagnitude;
        }
        if(this.motionType === 3) {
            this.y = this.originalY - Math.sin(frameCount / Math.PI * this.wiggleSpeed) * this.wiggleMagnitude;
            this.x = this.originalX - Math.sin(Math.PI + frameCount / Math.PI * this.wiggleSpeed) * this.wiggleMagnitude;
        }
    }
}

// An small physical cicular object
class CicleObject extends CircleCollider {

    constructor(x, y, radius, color) {
        super(x, y, radius, color);

        this.mass = radius;

        if(this.mass == 0) {
            this.inverseMass = 0;
        } else {
            this.inverseMass = 1 / this.mass;
        }

        this.velocity = [0, 0];
        this.force = [0, 0];
    }

    update() {
        this.force[1] += GRAVITY;

        this.velocity[0] += this.force[0];
        this.velocity[1] += this.force[1];
        
        this.force[0] = 0;
        this.force[1] = 0;

        // Test collisions with other objects
        for(let other of objects) {
            if(other === this) continue;

            if(this.intersectsWith(other)) {
                // Resolve collision
                let rv = [
                    other.velocity[0] - this.velocity[0],
                    other.velocity[1] - this.velocity[1]
                ];

                let delta = [
                    Math.max(Math.abs(this.x - other.x), 0.001),
                    Math.max(Math.abs(this.y - other.y), 0.001)
                ];

                let mag = magnitude(delta);

                let normal = [
                    (other.x - this.x) / mag,
                    (other.y - this.y) / mag
                ];

                let velAlongNormal = dotProduct(rv, normal);
                
                if(velAlongNormal > 0) continue;

                let newForce = -2 * velAlongNormal;
                newForce /= 1 / this.mass + 1 / other.mass;
                
                let impulse = [
                    newForce * normal[0],
                    newForce * normal[1]
                ];

                this.velocity[0] -= 1 / this.mass * impulse[0];
                this.velocity[1] -= 1 / this.mass * impulse[1];
                other.velocity[0] += 1 / other.mass * impulse[0];
                other.velocity[1] += 1 / other.mass * impulse[1];

                // Corrects penetration
                const percent = 0.2;
                const slop = 0.01;

                let penetration = other.radius + this.radius - mag;

                let corr = (Math.max(penetration - slop, 0) / (this.inverseMass + other.inverseMass)) * percent;

                let correction = [
                    corr * normal[0],
                    corr * normal[1]
                ];

                this.x -= this.inverseMass * correction[0];
                this.y -= this.inverseMass * correction[1];

                other.x += other.inverseMass * correction[0];
                other.y += other.inverseMass * correction[1];
            }
        }

        // Put object back inside the container if it leaves
        if(!this.unionsWith(container)) {

            let delta = [
                this.x - container.x,
                this.y - container.y
            ];

            let deltaMag = magnitude(delta);
            let distance = container.radius - deltaMag;
            let force = this.radius - distance;

            let vec = [
                force * -(delta[0] / deltaMag),
                force * -(delta[1] / deltaMag)
            ];

            this.x += vec[0];
            this.y += vec[1];

            // Bouce back
            this.velocity[0] += vec[0];
            this.velocity[1] += vec[1];
        }
    }

    applyVelocity() {
        this.x += this.velocity[0];
        this.y += this.velocity[1];
    }
}