function doGet(request) {
  if (Object.keys(request.parameter).length === 0) {
    return HtmlService.createTemplateFromFile('index')
      .evaluate();
  }
  let data = [];
  if (request.parameter.getAllUser) {
    data = getAllData();
  }
  if (request.parameter.missingFace) {
    data = missingFace();
  }
  if (request.parameter.feature) {
    data = faceFeature(request.parameter.feature);
  }
  if (request.parameter.getFaceFeature == "all") {
    data = getAllFaceFeature();
  }
  if (request.parameter.lastUpdated) {
    data = lastUpdatedFaceFeature();
  }
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(request) {
  let data = [];
  var payload = JSON.parse(request.postData.contents);
  if (payload.length == 3) {
    try {
      data = createOrUpdateFaceFeature(payload);
      // data = "Thành công";
    } catch (e) {
      data = "Thất bại" + e;
    }

  }
  if (payload.check) {
    data = check(payload.check);
  }
  if (payload.data) {
    data = register(payload.data);
  }
  if (payload.takeLeave) {
    data = takeLeave(payload.takeLeave);
  }
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
    .getContent();
}

const as = SpreadsheetApp.getActiveSpreadsheet();
let sheet1 = as.getSheetByName('Diem_danh');
let sheet2 = as.getSheetByName('Dang_ky');
let sheet3 = as.getSheetByName('feature');
let sheet4 = as.getSheetByName('Request');
let lastRow1 = sheet1.getLastRow();
let lastRow2 = sheet2.getLastRow();
let lastRow3 = sheet3.getLastRow();
let lastRow4 = sheet4.getLastRow();
let mssvLength = lastRow2 - 2;
let mssvList;
let nameList;
let idList;
if (mssvLength) {
  idList = sheet2.getRange("A3:A" + lastRow2).getValues();
  mssvList = sheet2.getRange("B3:B" + lastRow2).getValues();
  nameList = sheet2.getRange("C3:C" + lastRow2).getValues();
}

let today = new Date();
let date = ("0" + today.getDate()).slice(-2);
let month = ("0" + (today.getMonth() + 1)).slice(-2);
let year = today.getFullYear();
let hours = ("0" + today.getHours()).slice(-2);
let minutes = ("0" + today.getMinutes()).slice(-2);
let seconds = ("0" + today.getSeconds()).slice(-2);
let currentDateTime = `${date}/${month}/${year} ${hours}:${minutes}:${seconds}`;
let firstDayOfYear = new Date(today.getFullYear(), 0, 1);
let millisecondsInDay = 1000 * 60 * 60 * 24;
let daysPassed = Math.floor((today - firstDayOfYear) / millisecondsInDay);
let currentWeek = Math.ceil((daysPassed + 1) / 7);

function getAllData() {
  return mssvList.map(function (mssv, index) {
    return { id: idList[index][0], mssv: mssv[0], name: nameList[index][0] };
  });
}

function faceFeature(id) {
  let arr = [];
  let mssvArray = sheet3.getRange("A2:A" + lastRow3).getValues();
  let featureArray = sheet3.getRange("B2:B" + lastRow3).getValues();
  mssvArray.forEach((mssv, index) => {
    if (mssv[0] == id) {
      let faceFea = {};
      faceFea.mssv = mssv[0];
      faceFea.feature = featureArray[index][0];
      arr.push(faceFea);
    }
  })
  return arr;
}

function createOrUpdateFaceFeature(arr) {
  let mssvArray = sheet3.getRange("A2:A" + lastRow3).getValues();
  let array = [];
  mssvArray.forEach(mssv => array.push(mssv[0]));
  if (array.includes(parseInt(arr[0].mssv))) {
    let i = 0;
    mssvArray.forEach((mssv, index) => {
      if (mssv[0] == arr[0].mssv) {
        sheet3.getRange("B" + (index + 2)).setValue(arr[i].face_feature);
        sheet3.getRange("D" + (index + 2)).setValue(currentDateTime);
        i++;
      }
    })
  } else {
    for (i = 0; i < arr.length; i++) {
      sheet3.appendRow([arr[i].mssv, arr[i].face_feature, currentDateTime, currentDateTime]);
    }
  }
  return "Thành công";
}
function getAllFaceFeature() {
  let arr = [];
  let mssvArray = sheet3.getRange("A2:A" + lastRow3).getValues();
  mssvArray.forEach(mssv => {
    if (arr.includes(mssv[0]) == 0) {
      arr.push(mssv[0]);
    }
  })
  return arr;
}
function lastUpdatedFaceFeature() {
  let updatedAt = sheet3.getRange("D2:D" + lastRow3).getValues();
  let max = 0;
  updatedAt.forEach(date => {
    if (date[0] > max) {
      max = date[0];
    }
  })
  return new Date(max);

}
function register(signUp) {
  if (mssvLength) {
    let mssv1 = mssvList.some(mssv => mssv == signUp.mssv);
    if (mssv1) {
      mssvList.forEach((mssv, index) => {
        if (mssv[0] == signUp.mssv) {
          sheet2.getRange("F" + (index + 3) + ":S" + (index + 3)).setValues([signUp.list]);
          let col = column();
          let row = index + lastRow1 - mssvLength + 1;
          let arr = spliceArr(col, signUp.list);
          if (sheet1.getRange(col + row).getValue()) {
            let colValue = sheet1.getRange(col + row).getValue();
            sheet1.getRange(col + row + ":T" + row).setValues([arr]);
            sheet1.getRange(col + row).setValue(colValue);
          }
          else {
            sheet1.getRange(col + row + ":T" + row).setValues([arr]);
          }

        }
      })
    }
    else {
      let source = sheet2.getRange("A3:S3");
      let des = sheet2.getRange("A" + (lastRow2 + 1) + ":S" + (lastRow2 + 1));
      source.copyTo(des);
      des.clearContent();
      sheet2.appendRow([lastRow2 - 1, signUp.mssv, signUp.yourName, signUp.yourEmail, signUp.yourPhone, ...signUp.list]);
      addStudent(signUp);
    }
  }

  else {
    sheet2.appendRow([lastRow2 - 1, signUp.mssv, signUp.yourName, signUp.yourEmail, signUp.yourPhone, ...signUp.list]);
    addStudent(signUp);
  }

  return 'Đăng ký lịch thành công';
}

function spliceArr(column, arr) {
  let columns = ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
  let index = columns.findIndex(col => col === column);
  arr.splice(0, index);
  return arr;
}

function addStudent(signUp) {
  let source = sheet1.getRange("A" + lastRow1 + ":T" + lastRow1);
  let des = sheet1.getRange("A" + (lastRow1 + 1) + ":T" + (lastRow1 + 1));
  source.copyTo(des);
  des.clearContent();
  sheet1.appendRow([lastRow2 - 1, signUp.mssv, signUp.yourName, 0, today.getFullYear(), currentWeek, ...signUp.list]);
}

function column() {
  let day = today.getDay();
  let hour = today.getHours();

  let col;
  switch (day) {
    case 0: // Sunday
      col = hour < 12 ? 'S' : 'T';
      break;
    case 1: // Monday
      col = hour < 12 ? 'G' : 'H';
      break;
    case 2: // Tuesday
      col = hour < 12 ? 'I' : 'J';
      break;
    case 3: // Wednesday
      col = hour < 12 ? 'K' : 'L';
      break;
    case 4: // Thursday
      col = hour < 12 ? 'M' : 'N';
      break;
    case 5: // Friday
      col = hour < 12 ? 'O' : 'P';
      break;
    case 6: // Saturday
      col = hour < 12 ? 'Q' : 'R';
      break;
  }
  return col;
}
function check(mssv) {
  let col = column();
  for (var i = 0; i < mssvLength; i++) {
    if (mssvList[i][0] == mssv) {
      let row = i + lastRow1 - mssvLength + 1;
      if (sheet1.getRange(col + row).getValue()) {
        sheet1.getRange(col + row).setValue('Có mặt');
        return 'Điểm danh thành công';
      }
      else {
        sheet1.getRange(col + row).setValue('Có mặt 2');
        return 'Bạn không đăng ký buổi này và đã điểm danh thành công';
      }
    }
  }
}

function uppdateCheckin() {
  if (mssvLength) {
    let count;
    for (var i = 0; i <= mssvLength; i++) {
      let week = sheet1.getRange("F" + (lastRow1 - i)).getValue();
      if (week == currentWeek) {
        count = i;
      } else { break; }
    }
    if (count) {
      let idListSheet1 = sheet1.getRange("A" + (lastRow1 - count) + ":A" + lastRow1).getValues();
      let idArray = [];
      idListSheet1.forEach(id =>
        idArray.push(id[0])
      )
      // Logger.log(idArray);
      idList.forEach((id, index) => {
        if (idArray.includes(id[0]) == 0) {
          sheet1.getRange("A" + lastRow1 + ":F" + lastRow1)
            .copyTo(sheet1.getRange("A" + (lastRow1 + 1) + ":F" + (lastRow1 + 1)))
          sheet1.getRange("A" + (lastRow1 + 1) + ":F" + (lastRow1 + 1)).clearContent();
          sheet1.getRange("D" + (lastRow1 + 1)).setValue(0);
          sheet1.getRange("E" + (lastRow1 + 1)).setValue(today.getFullYear());
          sheet1.getRange("F" + (lastRow1 + 1)).setValue(currentWeek);
          sheet2.getRange("A" + (index + 3) + ":C" + ((index + 3)))
            .copyTo(sheet1.getRange("A" + (lastRow1 + 1) + ":C" + (lastRow1 + 1)));
          sheet2.getRange("F" + (index + 3) + ":S" + ((index + 3)))
            .copyTo(sheet1.getRange("G" + (lastRow1 + 1) + ":T" + (lastRow1 + 1)));
          lastRow1 += 1;
        }
      })
    } else {
      sheet2.getRange("A3:C" + lastRow2)
        .copyTo(sheet1.getRange("A" + (lastRow1 + 1) + ":C" + (lastRow1 + mssvLength)));
      sheet1.getRange("D" + lastRow1 + ":F" + lastRow1)
        .copyTo(sheet1.getRange("D" + (lastRow1 + 1) + ":F" + (lastRow1 + mssvLength)));
      sheet1.getRange("D" + (lastRow1 + 1) + ":D" + (lastRow1 + mssvLength))
        .setValue(0);
      sheet1.getRange("E" + (lastRow1 + 1) + ":E" + (lastRow1 + mssvLength))
        .setValue(today.getFullYear());
      sheet1.getRange("F" + (lastRow1 + 1) + ":F" + (lastRow1 + mssvLength))
        .setValue(currentWeek);
      sheet2.getRange("F3:S" + lastRow2)
        .copyTo(sheet1.getRange("G" + (lastRow1 + 1) + ":T" + (lastRow1 + mssvLength)));
      let lastWeek = sheet1.getRange("F" + lastRow1).getValue();
      let newWeek = currentWeek;
      if (newWeek != lastWeek) {
        let arrLastWeek = [];
        for (i = 0; i < lastWeek; i++) {
          arrLastWeek[i] = lastWeek - i;
        }
        let filter = sheet1.getFilter();
        const criteria = SpreadsheetApp.newFilterCriteria()
          .setHiddenValues(arrLastWeek)
          .build();
        filter.setColumnFilterCriteria(6, criteria);
      }
      unprocessedData();
    }

  }
}
function findWeek(date) {
  let firstDayOfYear = new Date(today.getFullYear(), 0, 1);
  let millisecondsInDay = 1000 * 60 * 60 * 24;
  let daysPassed = Math.floor((date - firstDayOfYear) / millisecondsInDay);
  return Math.ceil((daysPassed + 1) / 7);
}
function log2() {
  let a = sheet4.getRange("I3").getValue().split(", ");
  Logger.log(a)//doi chuoi thanh mang;
  Logger.log(a[0]);
  Logger.log(a[1]);
}

function onEdit(e) {
  let range = e.range;
  let value = range.getValue();
  let row = range.getRow();
  let oldStateRange = sheet4.getRange(row, 9);
  let oldState = sheet4.getRange(row, 9).getValue();
  let mssvRequest = sheet4.getRange(row, 2).getValue();
  let session = sheet4.getRange(row, 5).getValue();
  let requestDate = sheet4.getRange(row, 4).getValue();
  let createAt = sheet4.getRange(row, 7).getValue();
  let requestWeek = findWeek(requestDate);
  let createWeek = findWeek(createAt);
  let difference = createWeek - requestWeek;
  if (value == "Duyệt" && row >= 2) {
    if (difference == 0 || difference == 1) {
      let topRow = lastRow1 - (2 - (1 - difference)) * mssvLength + 1;
      let mssvArray = sheet1
        .getRange("B" + topRow + ":B" + (lastRow1 - mssvLength * difference))
        .getValues();
      mssvArray.forEach((mssv, index) => {
        if (mssv[0] == mssvRequest) {
          let col = selectSession(requestDate.getDay(), session);
          let cell = col + (index + topRow);
          let getCell = sheet1.getRange(cell);
          if (session == "Sáng" || session == "Chiều") {
            oldStateRange.setValue(getCell.getValue());
            getCell.setValue("Xin Nghỉ");
          } else if (session == "SángChiều") {
            oldStateRange.setValue(getCell.getValue() + ", " +
              sheet1.getRange(getCell.getRow(), getCell.getColumn() + 1).getValue());
            getCell.setValue("Xin Nghỉ");
            sheet1.getRange(getCell.getRow(), getCell.getColumn() + 1)
              .setValue("Xin Nghỉ");
          }
        }
      })
    } else if (difference == -1) {
      sheet4.getRange(row, 10).setValue(0);
    }
  } else if (value == "Từ chối" && oldState != "") {
    if (difference == 0 || difference == 1) {
      let topRow = lastRow1 - (2 - (1 - difference)) * mssvLength + 1;
      let mssvArray = sheet1
        .getRange("B" + topRow + ":B" + (lastRow1 - mssvLength * difference))
        .getValues();
      mssvArray.forEach((mssv, index) => {
        if (mssv[0] == mssvRequest) {
          let col = selectSession(requestDate.getDay(), session);
          let cell = col + (index + topRow);
          let getCell = sheet1.getRange(cell);
          if (session == "Sáng" || session == "Chiều") {
            getCell.setValue(oldState);
          } else if (session == "SángChiều") {
            let arr = oldState.split(", ");
            getCell.setValue(arr[0]);
            sheet1.getRange(getCell.getRow(), getCell.getColumn() + 1)
              .setValue(arr[1]);
          }
          oldStateRange.setValue("");
        }
      })
    }
  }
}

function unprocessedData() {
  let dataRange = sheet4.getRange("A2:J" + lastRow4);
  let condition = function (rowData) {
    return rowData[9] === 0;
  };
  let filteredData = dataRange.getValues().filter(condition);
  let row = filteredData[0][0] + 1;
  let mssvRequest = filteredData[0][1];
  let requestDate = filteredData[0][3];
  let session = filteredData[0][4];
  let oldStateRange = sheet4.getRange(row, 9);

  let topRow = lastRow1 - mssvLength + 1;
  let mssvArray = sheet1.getRange("B" + topRow + ":B" + lastRow1)
    .getValues();
  mssvArray.forEach((mssv, index) => {
    if (mssv[0] == mssvRequest) {
      let col = selectSession(requestDate.getDay(), session);
      let cell = col + (index + topRow);
      let getCell = sheet1.getRange(cell);
      if (session == "Sáng" || session == "Chiều") {
        oldStateRange.setValue(getCell.getValue());
        getCell.setValue("Xin Nghỉ");
      } else if (session == "SángChiều") {
        oldStateRange.setValue(getCell.getValue() + ", " +
          sheet1.getRange(getCell.getRow(), getCell.getColumn() + 1).getValue());
        getCell.setValue("Xin Nghỉ");
        sheet1.getRange(getCell.getRow(), getCell.getColumn() + 1)
          .setValue("Xin Nghỉ");
      }
      sheet4.getRange(row, 10).setValue("");
    }
  })
}
function selectSession(day, session) {
  let col;
  switch (day) {
    case 0: // Sunday
      col = (session == "Sáng" || session == "SángChiều") ? 'S' : 'T';
      break;
    case 1: // Monday
      col = (session == "Sáng" || session == "SángChiều") ? 'G' : 'H';
      break;
    case 2: // Tuesday
      col = (session == "Sáng" || session == "SángChiều") ? 'I' : 'J';
      break;
    case 3: // Wednesday
      col = (session == "Sáng" || session == "SángChiều") ? 'K' : 'L';
      break;
    case 4: // Thursday
      col = (session == "Sáng" || session == "SángChiều") ? 'M' : 'N';
      break;
    case 5: // Friday
      col = (session == "Sáng" || session == "SángChiều") ? 'O' : 'P';
      break;
    case 6: // Saturday
      col = (session == "Sáng" || session == "SángChiều") ? 'Q' : 'R';
      break;
  }
  return col;
}

function missingFace() {
  if (sheet3.getRange("A" + lastRow3).getValue() == "mssv") {
    return getAllData();
  } else {
    let mssvListSheet3 = sheet3.getRange("A2:A" + lastRow3).getValues();
    let mssvArray = [];
    let arr = getAllData();
    mssvListSheet3.forEach(mssv => mssvArray.push(mssv[0]));
    mssvList.forEach((mssv, index) => {
      if (mssvArray.includes(mssv[0])) {
        arr = arr.filter(item => item.mssv !== mssv[0]);
      }
    })
    return arr;
  }
}
function takeLeave(takeLeave) {
  sheet4.appendRow([lastRow4, takeLeave.mssv, takeLeave.yourName, takeLeave.date, takeLeave.time, takeLeave.reason, currentDateTime]);
  if (lastRow4 > 1) {
    sheet4.getRange("H" + lastRow4).copyTo(sheet4.getRange("H" + (lastRow4 + 1)));
    sheet4.getRange("H" + (lastRow4 + 1)).clearContent();
  }
  return "Xin nghỉ thành công";
}