let video;
let facemesh;
let handpose;
let predictions = [];
let handPredictions = [];
let circleX, circleY;

function setup() {
  createCanvas(640, 480).position(
    (windowWidth - 640) / 2,
    (windowHeight - 480) / 2
  );
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  facemesh = ml5.facemesh(video, modelReady);
  facemesh.on('predict', results => {
    predictions = results;
  });

  handpose = ml5.handpose(video, modelReady);
  handpose.on('predict', results => {
    handPredictions = results;
  });

  circleX = width / 2;
  circleY = height / 2;
}

function modelReady() {
  console.log("模型載入完成");
}

function draw() {
  image(video, 0, 0, width, height);

  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;

    // 預設圓環位置為第94點
    const [x, y] = keypoints[94];
    circleX = x;
    circleY = y;

    if (handPredictions.length > 0) {
      const hand = handPredictions[0];
      const annotations = hand.annotations;

      // 偵測剪刀手勢 (食指和中指分開)
      const indexFinger = annotations.indexFinger;
      const middleFinger = annotations.middleFinger;

      if (indexFinger && middleFinger) {
        const indexTip = indexFinger[3];
        const middleTip = middleFinger[3];
        const distance = dist(indexTip[0], indexTip[1], middleTip[0], middleTip[1]);

        if (distance > 50) {
          // 剪刀手勢，移動圓環到額頭
          const forehead = keypoints[10]; // 額頭點
          circleX = forehead[0];
          circleY = forehead[1];
        }
      }

      // 偵測布手勢 (手掌張開)
      const thumb = annotations.thumb;
      const pinky = annotations.pinky;

      if (thumb && pinky) {
        const thumbTip = thumb[3];
        const pinkyTip = pinky[3];
        const palmWidth = dist(thumbTip[0], thumbTip[1], pinkyTip[0], pinkyTip[1]);

        if (palmWidth > 100) {
          // 布手勢，移動圓環到左眼睛
          const leftEye = keypoints[159]; // 左眼睛點
          circleX = leftEye[0];
          circleY = leftEye[1];
        }
      }

      // 偵測石頭手勢 (手指彎曲)
      const curledFingers = annotations.indexFinger.every(pt => pt[1] > annotations.palmBase[0][1]) &&
                            annotations.middleFinger.every(pt => pt[1] > annotations.palmBase[0][1]) &&
                            annotations.ringFinger.every(pt => pt[1] > annotations.palmBase[0][1]) &&
                            annotations.pinky.every(pt => pt[1] > annotations.palmBase[0][1]);

      if (curledFingers) {
        // 石頭手勢，移動圓環到右眼睛
        const rightEye = keypoints[386]; // 右眼睛點
        circleX = rightEye[0];
        circleY = rightEye[1];
      }
    }
  }

  // 繪製圓環
  noFill();
  stroke(255, 0, 0);
  strokeWeight(4);
  ellipse(circleX, circleY, 100, 100);
}
