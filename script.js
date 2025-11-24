// ====== ตัวแปรเกม ======
const vocabulary=[
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

const correctSound=new Audio("sounds/correct.mp3");
const wrongSound=new Audio("sounds/wrong.mp3");

let correctAnswer="",score=0,round=1,timeLeft=60,timerInterval=null,isAnswering=true;
let lastQuestionIndex=-1;
let handModel,lastHoverChoice=null;

// Canvas สำหรับมาร์คนิ้ว
const canvas=document.getElementById("hand-canvas");
const ctx=canvas.getContext("2d");

// ====== UI ======
function updateUI(){
    document.getElementById("score-box").textContent="Score: "+score;
    document.getElementById("round-box").textContent="Question: "+round;
    document.getElementById("timer-box").textContent="Time: "+timeLeft;
}

// ====== Timer ======
function startTimer(){
    timerInterval=setInterval(()=>{
        timeLeft--; updateUI();
        if(timeLeft<=0) endGame();
    },1000);
}

// ====== สุ่มคำถาม ======
function generateQuestion(){
    let questionIndex;
    do{ questionIndex=Math.floor(Math.random()*vocabulary.length); } 
    while(questionIndex===lastQuestionIndex);
    lastQuestionIndex=questionIndex;
    const q=vocabulary[questionIndex];
    correctAnswer=q.eng;

    document.getElementById("question-image").src=q.img;
    document.getElementById("thai-word").textContent=q.thai;

    let choices=[q.eng];
    while(choices.length<4){
        let r=vocabulary[Math.floor(Math.random()*vocabulary.length)].eng;
        if(!choices.includes(r)) choices.push(r);
    }
    choices=shuffleArray(choices);

    const choiceEls=["choice-tl","choice-tr","choice-bl","choice-br"].map(id=>document.getElementById(id));
    choiceEls.forEach((el,i)=>{ el.textContent=choices[i]; el.dataset.word=choices[i]; });
}
function shuffleArray(arr){ return arr.sort(()=>Math.random()-0.5); }

// ====== เลือกคำตอบ ======
function selectAnswer(choiceWord,el){
    if(!isAnswering) return;
    isAnswering=false;
    if(choiceWord===correctAnswer){ el.classList.add("correct"); correctSound.play(); score++; }
    else{ el.classList.add("wrong"); wrongSound.play(); }
    updateUI();
    setTimeout(()=>{ el.classList.remove("correct","wrong"); round++; updateUI(); generateQuestion(); isAnswering=true; },1200);
}
document.querySelectorAll(".choice").forEach(el=>el.addEventListener("click",()=>selectAnswer(el.dataset.word,el)));

// ====== เริ่มเกม ======
document.getElementById("start-button").addEventListener("click",()=>{
    document.getElementById("start-screen").style.display="none";
    resetGame();
});
function resetGame(){ score=0; round=1; timeLeft=60; isAnswering=true; updateUI(); startTimer(); generateQuestion(); }

// ====== เกมจบ ======
function endGame(){ clearInterval(timerInterval); document.getElementById("game-over-screen").style.display="flex"; document.getElementById("final-score").textContent="คุณได้คะแนน "+score; }
document.getElementById("restart-button").addEventListener("click",()=>{ document.getElementById("game-over-screen").style.display="none"; resetGame(); });

// ====== Hand Tracking + Mirror + Finger Marker ======
async function initHandTracking(){
    const video=document.getElementById("camera");
    const stream=await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"user" } });
    video.srcObject=stream;
    await video.play();
    video.style.transform="scaleX(-1)"; // mirror
    canvas.width=video.videoWidth; canvas.height=video.videoHeight;

    handModel=await handpose.load();
    detectHands(video);
}

async function detectHands(video){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const predictions=await handModel.estimateHands(video,true);

    if(predictions.length>0){
        const tip=predictions[0].landmarks[8]; // ปลายนิ้วชี้
        const x=canvas.width - tip[0]; // mirror X
        const y=tip[1];

        // วาดมาร์คนิ้ว
        ctx.beginPath();
        ctx.arc(x,y,15,0,2*Math.PI);
        ctx.fillStyle="rgba(255,0,0,0.6)";
        ctx.fill();

        // แปลงตำแหน่งสำหรับ hover ปุ่ม
        const videoRect=video.getBoundingClientRect();
        const px=videoRect.width - (tip[0]/video.videoWidth*videoRect.width);
        const py=tip[1]/video.videoHeight*videoRect.height;
        checkHandHover(px,py);
    } else lastHoverChoice=null;

    requestAnimationFrame(()=>detectHands(video));
}

function checkHandHover(x,y){
    const choices=document.querySelectorAll(".choice");
    let hovered=null;
    choices.forEach(el=>{
        const rect=el.getBoundingClientRect();
        if(x>=rect.left && x<=rect.right && y>=rect.top && y<=rect.bottom) hovered=el;
    });
    if(hovered && hovered!==lastHoverChoice){
        lastHoverChoice=hovered;
        selectAnswer(hovered.dataset.word,hovered);
    } else if(!hovered) lastHoverChoice=null;
}

// เริ่ม Hand Tracking
window.onload=initHandTracking;