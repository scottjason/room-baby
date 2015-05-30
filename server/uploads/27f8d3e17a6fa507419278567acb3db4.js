/api/analytics / syncsTotal / : calendarId - request {
  startTime: int,
  endTime: int
}

{
  count: int
}
/api/analytics / clicksTotal / : calendarId - request {
  startTime: int,
  endTime: int
}

{
  count: int
}
/api/analytics / syncs / category / : calendarId - request {
  startTime: int,
  endTime: int
}

{
  analytics: [{
    "_id": {
      "category": null,
      "year": 2015,
      "dayOfYear": 146
    },
    "total": 1
  }, ]
}

{
  "categoryId": null,
  "total": 1,
  "syncedOn": 1234123412341234123,
  "categoryName": string,
},

/api/analytics / clicks / activity / : calendarId - request {
  startTime: int,
  endTime: int
}

{
  analytics: [{
    "_id": {
      "category": "52ab80edcdafe7a001000021",
      "type": "linkClick",
      "activity": "54357795a010daaa65845aba",
      "year": 2015,
      "dayOfYear": 145
    },
    "total": 1
  }, ]
}

{
  "categoryId": null,
  "total": 1,
  "type": string,
  "activityId": int,
  "activityName": string,
  "syncedOn": 1234123412341234123,
  "categoryName": string,
},

/api/analytics / syncs / syncType / : calendarId - request {
  startTime: int,
  endTime: int
} {
  analytics: [{
    "_id": {
      "syncType": "sync-windows",
      "year": 2015,
      "dayOfYear": 146,
      "category": "52ab80edcdafe7a001000007"
    },
    "total": 1
  }, ]
}
