नीचे MongoDB के important operators का **simple plain explanation + example** दिया है। यह ऐसे लिखा है जैसे एक **single notes page** हो ताकि पढ़ने में आसान हो।

---

# MongoDB Important Operators – Explanation with Examples

## 1. $in

Meaning:
$in का मतलब है **दी गई list में से कोई भी value match हो जाए**।

Use case:
जब हमें multiple values में से match करना हो।

Example data (users collection):

name: Ali
name: Rahul
name: Sara

Query:

db.users.find({
name: { $in: ["Ali","Sara"] }
})

Explanation:
यह query उन users को return करेगी जिनका name **Ali या Sara** है।

Result:

Ali
Sara

Real use:
Chat app में multiple message IDs find करने के लिए।

Example:

Message.find({
_id: { $in: messageIds }
})

---

# 2. $set

Meaning:
$set का use **किसी field की value update करने** के लिए होता है।

Example data:

name: Ali
age: 22

Query:

db.users.updateOne(
{ name: "Ali" },
{ $set: { age: 25 } }
)

Explanation:
यह Ali की age को **22 से 25** कर देगा।

Real use:
message delivered update करना।

Example:

{ $set: { delivered: true } }

---

# 3. $push

Meaning:
$push का use **array में नई value add करने** के लिए होता है।

Example data:

name: Ali
skills: ["node","js"]

Query:

db.users.updateOne(
{ name: "Ali" },
{ $push: { skills: "mongodb" } }
)

Result:

skills: ["node","js","mongodb"]

Real use:
group में member add करना।

Example:

Group.updateOne(
{ _id: groupId },
{ $push: { members: userId } }
)

---

# 4. $pull

Meaning:
$pull का use **array से value remove करने** के लिए होता है।

Example data:

skills: ["node","js","mongodb"]

Query:

db.users.updateOne(
{ name: "Ali" },
{ $pull: { skills: "js" } }
)

Result:

skills: ["node","mongodb"]

Real use:
group से member remove करना।

---

# 5. $inc

Meaning:
$inc का use **number increase या decrease करने** के लिए होता है।

Example data:

messages: 5

Query:

db.users.updateOne(
{ name: "Ali" },
{ $inc: { messages: 1 } }
)

Result:

messages: 6

Real use:

unread messages count
likes
views

---

# 6. $or

Meaning:
$or का मतलब है **अगर कोई भी condition true हो जाए**।

Example data:

Ali age:22
Rahul age:30
Sara age:27

Query:

db.users.find({
$or: [
{ age: 22 },
{ age: 27 }
]
})

Result:

Ali
Sara

Explanation:
अगर age **22 या 27** हो तो record मिलेगा।

---

# 7. $and

Meaning:
$and का मतलब है **दोनों conditions true होनी चाहिए**।

Example data:

name: Sara
age: 27
salary: 35000

Query:

db.users.find({
$and: [
{ age: 27 },
{ salary: 35000 }
]
})

Result:

Sara

Explanation:
दोनों conditions match करनी जरूरी हैं।

Note:
MongoDB में normally $and लिखने की जरूरत नहीं होती क्योंकि default behavior AND होता है।

Example:

db.users.find({
age:27,
salary:35000
})

---

# 8. $exists

Meaning:
$exists check करता है कि **field database में मौजूद है या नहीं**।

Example data:

User1
name: Ali
age: 22

User2
name: Rahul

Query:

db.users.find({
age: { $exists: true }
})

Result:

Ali

Explanation:
क्योंकि Rahul के पास age field नहीं है।

Real use:
optional fields check करने के लिए।

---

# 9. $gt

Meaning:
$gt का मतलब है **greater than ( > )**।

Example data:

Ali age:22
Rahul age:30
Sara age:27

Query:

db.users.find({
age: { $gt: 25 }
})

Result:

Rahul
Sara

Explanation:
जिनकी age **25 से ज्यादा** है।

---

# 10. $lt

Meaning:
$lt का मतलब है **less than ( < )**।

Query:

db.users.find({
age: { $lt: 25 }
})

Result:

Ali

Explanation:
जिनकी age **25 से कम** है।

---

# Quick Summary

$in
multiple values match करने के लिए

$set
field update करने के लिए

$push
array में value add करने के लिए

$pull
array से value remove करने के लिए

$inc
number increase या decrease करने के लिए

$or
अगर कोई भी condition true हो

$and
दोनों condition true हो

$exists
field database में है या नहीं

$gt
greater than ( > )

$lt
less than ( < )

---

अगर चाहो तो मैं तुम्हें **MongoDB के real backend project examples (chat app + ecommerce)** के साथ भी समझा सकता हूँ कि इन operators का **exact production use कैसे होता है**।
