// ===== Vocabulary =====
const vocabulary = [
  {thai:"ตื่นนอน",eng:"wake up",img:"images/wakeup.png"},
  {thai:"แปรงฟัน",eng:"brush teeth",img:"images/brushing.png"},
  {thai:"อาบน้ำ",eng:"take a shower",img:"images/shower.png"},
  {thai:"แต่งตัว",eng:"get dressed",img:"images/dress.png"},
  {thai:"กินอาหารเช้า",eng:"eat breakfast",img:"images/breakfast.png"},
  {thai:"ไปโรงเรียน",eng:"go to school",img:"images/school.png"},
  {thai:"ทำการบ้าน",eng:"do homework",img:"images/homework.png"},
  {thai:"ออกกำลังกาย",eng:"exercise",img:"images/exercise.png"},
  {thai:"เข้านอน",eng:"go to bed",img:"images/bed.png"},
  {thai:"ล้างหน้า",eng:"wash face",img:"images/washface.png"},
  {thai:"จัดเตียง",eng:"make the bed",img:"images/makebed.png"},
  {thai:"กินข้าวกลางวัน",eng:"eat lunch",img:"images/lunch.png"},
  {thai:"อ่านหนังสือ",eng:"read a book",img:"images/readbook.png"},
  {thai:"ล้างจาน",eng:"wash the dishes",img:"images/washdishes.png"},
  {thai:"เล่นกับเพื่อน",eng:"play with friends",img:"images/playfriends.png"}
];

// Sounds
const correctSound=new Audio("sounds/correct.mp3");
const wrongSound=new Audio("sounds/wrong.mp3");

// Game variables
let correctAnswer="",score=0,round=1,timeLeft=60,isAnswering=true;
let timerInterval=null,lastQuestionIndex=-1,lastHoverChoice=null;

// Canvas
const canvas=document.getElementById("hand-canvas");
const ctx=canvas.getContext("2d");

// ===== UI =====
function updateUI(){
    document.getElementById("score-box").textContent="Score: "+score;
    document.getElementById("round-box").textContent="Question: "+round;
    document.getElementById("timer-box").textContent="Time: "+timeLeft;
}

// Timer
function startTimer(){
    timerInterval=setInterval(()=>{
        timeLeft--;
        updateUI();
        if(timeLeft<=0) endGame();
    },1000);
}

// Generate question
function generateQuestion(){
    let idx;
    do{ idx=Math.floor(Math.random()*vocabulary.length); }
    while(idx===lastQuestionIndex);
    lastQuestionIndex=idx;

    const q=vocabulary[idx];
    correctAnswer=q.eng;
    document.getElementById("question-image").src=q.img;
    document.getElementById("thai-word").textContent=q.thai;

    // random choices
    let choices=[q.eng];
    while(choices.length<4){
        let w=vocabulary[Math.floor(Math.random()*vocabulary.length)].eng;
        if(!choices.includes(w)) choices.push(w);
    }
    choices.sort(()=>Math.random()-0.5);

    ["choice-tl","choice-tr","choice-bl","choice-br"].forEach((id,i)=>{
        const el=document.getElementById(id);
        el.textContent=choices[i];
        el.dataset.word=choices[i];
    });
}

// Select answer
function selectAnswer(ans,el){
    if(!isAnswering) return;
    isAnswering=false;

    if(ans===correctAnswer){
        score++;
        el.classList.add("correct");
        correctSound.play();
    } else {
        el.classList.add("wrong");
        wrongSound.play();
    }
    updateUI();

    setTimeout(()=>{
        el.classList.remove("correct","wrong");
        round++; updateUI(); generateQuestion();
        isAnswering=true;
    },1000);
}

// Click fallback
document.querySelectorAll(".choice").forEach(el=>{
    el.addEventListener("click",()=>selectAnswer(el.dataset.word,el));
});

// Start
document.getElementById("start-button").addEventListener("click",()=>{
    document.getElementById("start-screen").style.display="none";
    resetGame();
});
function resetGame(){
    score=0; round=1; timeLeft=60; isAnswering=true;
    updateUI(); startTimer(); generateQuestion();
}

// Game over
function endGame(){
    clearInterval(timerInterval);
    document.getElementById("game-over-screen").style.display="flex";
    document.getElementById("final-score").textContent="คุณได้คะแนน "+score;
}
document.getElementById("restart-button").addEventListener("click",()=>{
    document.getElementById("game-over-screen").style.display="none";
    resetGame();
});

// ===== Hand Tracking =====
async function initHandTracking(){
    const video=document.getElementById("camera");

    const stream=await navigator.mediaDevices.getUserMedia({
        video:{ facingMode:"user" }
    });

    video.srcObject=stream;
    await video.play();
    video.style.transform="scaleX(-1)";

    canvas.width=video.videoWidth;
    canvas.height=video.videoHeight;

    const model=handPoseDetection.SupportedModels.MediaPipeHands;
    const detector=await handPoseDetection.createDetector(model,{
        runtime:"tfjs",
        modelType:"full",
        maxHands:1
    });

    async function track(){
        const hands=await detector.estimateHands(video);
        ctx.clearRect(0,0,canvas.width,canvas.height);

        if(hands.length>0){
            const finger=hands[0].keypoints.find(k=>k.name==="index_finger_tip");
            if(finger){
                const x=canvas.width-finger.x;
                const y=finger.y;

                // draw fingertip
                ctx.beginPath();
                ctx.arc(x,y,15,0,2*Math.PI);
                ctx.fillStyle="rgba(255,0,0,0.7)";
                ctx.fill();

                checkHandHover(x,y);
            }
        }
        requestAnimationFrame(track);
    }
    track();
}

function checkHandHover(x,y){
    let target=null;
    document.querySelectorAll(".choice").forEach(el=>{
        const r=el.getBoundingClientRect();
        if(x>=r.left && x<=r.right && y>=r.top && y<=r.bottom){
            target=el;
        }
    });

    if(target && target!==lastHoverChoice){
        lastHoverChoice=target;
        selectAnswer(target.dataset.word,target);
    } 
    else if(!target){
        lastHoverChoice=null;
    }
}

window.onload=initHandTracking;
