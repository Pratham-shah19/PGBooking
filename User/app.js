const express = require("express");
const app = express();
const { BadRequestError, UnauthenticatedError } = require("./errors/index");

//dependencies
require("dotenv").config();
require("express-async-errors");
const { StatusCodes } = require("http-status-codes");
const multer = require("multer");
const { ref, uploadBytes, deleteObject, listAll } = require("firebase/storage");
const storage = require("./firebase");
const memoStorage = multer.memoryStorage();
const upload = multer({ memoStorage });

// extra security packages
const helmet = require("helmet");
const cors = require("cors");

//models
const Owner = require("./models/Owner");
const Room = require("./models/Room");

//connectDB
const connectDB = require("./db/connect");

// routers
const userRouter = require("./routes/User");
const ownerRouter = require("./routes/Owner");

//middleware
const OwnerMiddleware = require("./middleware/authentication_owner");
app.use(express.static(`${__dirname}/public`));
app.use(express.json());
app.use(helmet());
app.use(cors());

// app.get("/populate", async (req, res) => {
//   let data = {
//     phoneno: "9723566998",
//     lat: {
//       $numberDecimal: "24.75342322173403",
//     },
//     lng: {
//       $numberDecimal: "92.78157535957803",
//     },
//     phoneotp: 2272,
//     mailotp: 0,
//     address:
//       "QQ2V+J75, SH 39, Ghungoor, Masimpur, Bariknagar Pt II, Assam 788118",
//     aadhaarno: {
//       name: "Screenshot_20230317-174315_merchantApp.jpg-1679058303149",
//       uri: "https://firebasestorage.googleapis.com/v0/b/ssip-images.appspot.com/o/Screenshot_20230317-174315_merchantApp.jpg-1679058303149?alt=media",
//     },
//     addressproof: {
//       name: "Screenshot_20230317-182059_merchantApp.jpg-1679058306264",
//       uri: "https://firebasestorage.googleapis.com/v0/b/ssip-images.appspot.com/o/Screenshot_20230317-182059_merchantApp.jpg-1679058306264?alt=media",
//     },
//     photos: [
//     ],
//     videos: [],
//     Rules: [""],
//     About:
//       "There are four blocks named East West North & South. Each room is for two students of different branches. There are 4 floors including the ground floor. One canteen is there. There is one guard to look for the hostel. Academic building is 500 meters from PG hostel.\n\nInside room you will get one bed, one fan, two tube lights, LAN supply is there, one table, one chair. Big drawer is there, one for each student. You have to buy your own bed sheet, bed, pillow, bucket etc. Each floor has bathrooms and toilets. It is cleaned in every two days. It is always in good condition. 24*7 water and electricity supply.\n\nThere are grounds for volleyball and badminton. One tennis playground is also there you can play in night too.",
//     interestedusers: 0,
//     views: 4,
//     ratings: {
//       $numberDecimal: "0",
//     },
//     noofraters: 0,
//     cityname: "Silchar",
//     famousplacedistance: [

//     ],
//     isMale: false,
//     isFemale: true,
//     isAC: true,
//     isCooler: true,
//     typeofpg: "HOSTEL",
//     isWIFI: true,
//     isHotWater: false,
//     mode: "LIGHT",
//     phoneVerified: true,
//     detailsEntered: false,
//     nameasperaadhar: "Shankar Pandey",
//     propertytitle: "NIT Silchar Girls Hostel",
//     roomFilled: true,
//     email: "Kirtanprajapati193@gmail.com",
//     password: "$2a$10$l3SOplE73lKCIZGDeYKqTOtz86rEeoD1rPGUzTj2TRH6j1HVsWvvS",
//     name: "Shankar Pandey",
//     __v: 0,
//   };

//   const ss = await Owner.findOneAndUpdate({_id:'64128e057536ec50a4635601'},data)

//   res.send("success");
// });
//routes user
app.use("/api/v1/user", userRouter);
//routes owner
app.use("/api/v1/owner", ownerRouter);

//images/videos routes
app.post(
  "/api/v1/addownerphoto",
  OwnerMiddleware,
  upload.single("pic"),
  async (req, res) => {
    const { ownerId } = req.user;
    if (!ownerId) {
      throw new BadRequestError("Please provide Owner ID");
    }
    const file = req.file;
    const dateTime = new Date().getTime();
    const imageRef = ref(storage, `${file.originalname}-${dateTime}`);
    const metatype = {
      contentType: file.mimetype,
      name: `${file.originalname}-${dateTime}`,
    };
    const snapshot = await uploadBytes(imageRef, file.buffer, metatype);
    const ownerx = await Owner.findOne({ _id: ownerId });
    var obj = {
      name: snapshot.ref._location.path_,
      uri: `https://firebasestorage.googleapis.com/v0/b/${snapshot.ref._location.bucket}/o/${snapshot.ref._location.path_}?alt=media`,
    };
    ownerx.photos.push(obj);
    const owner = await Owner.findOneAndUpdate({ _id: ownerId }, ownerx, {
      runValidators: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    res.status(StatusCodes.OK).json({ res: "Success", data: owner });
  }
);
app.delete("/api/v1/deleteownerphoto", OwnerMiddleware, async (req, res) => {
  const { name } = req.body;
  const { ownerId } = req.user;
  const deleteRef = ref(storage, name);
  const resp = await deleteObject(deleteRef);
  const owner = await Owner.findOne({ _id: ownerId });
  let photo = owner.photos.filter((own) => {
    return own.name != name;
  });
  const ownerx = await Owner.findOneAndUpdate(
    { _id: ownerId },
    { photos: photo },
    { runValidators: true, new: true, setDefaultsOnInsert: true }
  );
  res.status(StatusCodes.OK).json({ res: "Success", data: ownerx });
});

app.post(
  "/api/v1/addownervideo",
  OwnerMiddleware,
  upload.single("pic"),
  async (req, res) => {
    const { ownerId } = req.user;
    if (!ownerId) {
      throw new BadRequestError("Please provide Owner ID");
    }
    const file = req.file;
    const dateTime = new Date().getTime();
    const imageRef = ref(storage, `${file.originalname}-${dateTime}`);
    const metatype = {
      contentType: file.mimetype,
      name: `${file.originalname}-${dateTime}`,
    };
    const snapshot = await uploadBytes(imageRef, file.buffer, metatype);
    const ownerx = await Owner.findOne({ _id: ownerId });
    var obj = {
      name: snapshot.ref._location.path_,
      uri: `https://firebasestorage.googleapis.com/v0/b/${snapshot.ref._location.bucket}/o/${snapshot.ref._location.path_}?alt=media`,
    };
    ownerx.videos.push(obj);
    const owner = await Owner.findOneAndUpdate({ _id: ownerId }, ownerx, {
      runValidators: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    res.status(StatusCodes.OK).json({ res: "Success", data: owner });
  }
);
app.delete("/api/v1/deleteownervideo", OwnerMiddleware, async (req, res) => {
  const { name } = req.body;
  const { ownerId } = req.user;
  const deleteRef = ref(storage, name);
  const resp = await deleteObject(deleteRef);
  const owner = await Owner.findOne({ _id: ownerId });
  let video = owner.videos.filter((own) => {
    return own.name != name;
  });
  const ownerx = await Owner.findOneAndUpdate(
    { _id: ownerId },
    { videos: video },
    { runValidators: true, new: true, setDefaultsOnInsert: true }
  );
  res.status(StatusCodes.OK).json({ res: "Success", data: ownerx });
});

app.post(
  "/api/v1/addroomphoto/:rid",
  OwnerMiddleware,
  upload.single("pic"),
  async (req, res) => {
    const { ownerId } = req.user;
    const { rid } = req.params;
    if (!rid) {
      throw new BadRequestError("Please provide Room ID");
    }
    const file = req.file;
    const dateTime = new Date().getTime();
    const imageRef = ref(storage, `${file.originalname}-${dateTime}`);
    const metatype = {
      contentType: file.mimetype,
      name: `${file.originalname}-${dateTime}`,
    };
    const snapshot = await uploadBytes(imageRef, file.buffer, metatype);
    const roomx = await Room.findOne({ _id: rid });
    if (!roomx) {
      throw new BadRequestError("Please provide Valid Room ID");
    }
    var obj = {
      name: snapshot.ref._location.path_,
      uri: `https://firebasestorage.googleapis.com/v0/b/${snapshot.ref._location.bucket}/o/${snapshot.ref._location.path_}?alt=media`,
    };
    roomx.photos.push(obj);
    const room = await Room.findOneAndUpdate({ _id: rid }, roomx, {
      runValidators: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    res.status(StatusCodes.OK).json({ res: "Success", data: room });
  }
);

app.delete(
  "/api/v1/deleteroomphoto/:rid",
  OwnerMiddleware,
  async (req, res) => {
    const { name } = req.body;
    const { rid } = req.params;
    if (!rid) {
      throw new BadRequestError("Please provide Room ID");
    }

    const deleteRef = ref(storage, name);
    const resp = await deleteObject(deleteRef);
    const room = await Room.findOne({ _id: rid });
    let photo = room.photos.filter((own) => {
      return own.name != name;
    });
    const roomx = await Room.findOneAndUpdate(
      { _id: rid },
      { photos: photo },
      { runValidators: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(StatusCodes.OK).json({ res: "Success", data: roomx });
  }
);

app.post(
  "/api/v1/addroomvideo/:rid",
  OwnerMiddleware,
  upload.single("pic"),
  async (req, res) => {
    const { ownerId } = req.user;
    const { rid } = req.params;
    if (!rid) {
      throw new BadRequestError("Please provide Room ID");
    }
    const file = req.file;
    const dateTime = new Date().getTime();
    const imageRef = ref(storage, `${file.originalname}-${dateTime}`);
    const metatype = {
      contentType: file.mimetype,
      name: `${file.originalname}-${dateTime}`,
    };
    const snapshot = await uploadBytes(imageRef, file.buffer, metatype);
    const roomx = await Room.findOne({ _id: rid });
    if (!roomx) {
      throw new BadRequestError("Please provide Valid Room ID");
    }
    var obj = {
      name: snapshot.ref._location.path_,
      uri: `https://firebasestorage.googleapis.com/v0/b/${snapshot.ref._location.bucket}/o/${snapshot.ref._location.path_}?alt=media`,
    };
    roomx.videos.push(obj);
    const room = await Room.findOneAndUpdate({ _id: rid }, roomx, {
      runValidators: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    res.status(StatusCodes.OK).json({ res: "Success", data: room });
  }
);
app.delete("/api/v1/deleteroomvideo", OwnerMiddleware, async (req, res) => {
  const { name } = req.body;
  const { rid } = req.params;
  if (!rid) {
    throw new BadRequestError("Please provide Room ID");
  }

  const deleteRef = ref(storage, name);
  const resp = await deleteObject(deleteRef);
  const room = await Room.findOne({ _id: rid });
  let video = room.videos.filter((own) => {
    return own.name != name;
  });
  const roomx = await Room.findOneAndUpdate(
    { _id: rid },
    { videos: video },
    { runValidators: true, new: true, setDefaultsOnInsert: true }
  );
  res.status(StatusCodes.OK).json({ res: "Success", data: roomx });
});

app.get("/api/v1/checkimageorvideo", async (req, res) => {
  const listRef = ref(storage);
  let productPictures = [];
  await listAll(listRef)
    .then((pics) => {
      productPictures = pics.items.map((item) => {
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${item._location.bucket}/o/${item._location.path_}?alt=media`;
        return {
          url: publicUrl,
          name: item._location.path_,
        };
      });
      res.send(productPictures);
    })
    .catch((error) => console.log(error.message));
});

app.post(
  "/api/v1/addaddressproof",
  OwnerMiddleware,
  upload.single("pic"),
  async (req, res) => {
    const { ownerId } = req.user;
    if (!ownerId) {
      throw new BadRequestError("Please provide Owner ID");
    }
    const file = req.file;
    const dateTime = new Date().getTime();
    const imageRef = ref(storage, `${file.originalname}-${dateTime}`);
    const metatype = {
      contentType: file.mimetype,
      name: `${file.originalname}-${dateTime}`,
    };
    const snapshot = await uploadBytes(imageRef, file.buffer, metatype);
    var obj = {
      name: snapshot.ref._location.path_,
      uri: `https://firebasestorage.googleapis.com/v0/b/${snapshot.ref._location.bucket}/o/${snapshot.ref._location.path_}?alt=media`,
    };
    const owner = await Owner.findOneAndUpdate(
      { _id: ownerId },
      { addressproof: obj },
      { runValidators: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(StatusCodes.OK).json({ res: "Success", data: owner });
  }
);
app.delete("/api/v1/deleteaddressproof", OwnerMiddleware, async (req, res) => {
  const { name } = req.body;
  const { ownerId } = req.user;
  if (!ownerId) {
    throw new BadRequestError("Please provide Owner ID");
  }
  const deleteRef = ref(storage, name);
  const resp = await deleteObject(deleteRef);
  const ownerx = await Owner.findOneAndUpdate(
    { _id: ownerId },
    { addressproof: {} },
    { runValidators: true, new: true, setDefaultsOnInsert: true }
  );
  res.status(StatusCodes.OK).json({ res: "Success", data: ownerx });
});
app.post(
  "/api/v1/addaadharproof",
  OwnerMiddleware,
  upload.single("pic"),
  async (req, res) => {
    const { ownerId } = req.user;
    if (!ownerId) {
      throw new BadRequestError("Please provide Owner ID");
    }
    const file = req.file;
    const dateTime = new Date().getTime();
    const imageRef = ref(storage, `${file.originalname}-${dateTime}`);
    const metatype = {
      contentType: file.mimetype,
      name: `${file.originalname}-${dateTime}`,
    };
    const snapshot = await uploadBytes(imageRef, file.buffer, metatype);
    var obj = {
      name: snapshot.ref._location.path_,
      uri: `https://firebasestorage.googleapis.com/v0/b/${snapshot.ref._location.bucket}/o/${snapshot.ref._location.path_}?alt=media`,
    };
    const owner = await Owner.findOneAndUpdate(
      { _id: ownerId },
      { aadhaarno: obj },
      { runValidators: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(StatusCodes.OK).json({ res: "Success", data: owner });
  }
);
app.delete("/api/v1/deleteaadharproof", OwnerMiddleware, async (req, res) => {
  const { name } = req.body;
  const { ownerId } = req.user;
  if (!ownerId) {
    throw new BadRequestError("Please provide Owner ID");
  }
  const deleteRef = ref(storage, name);
  const resp = await deleteObject(deleteRef);
  const ownerx = await Owner.findOneAndUpdate(
    { _id: ownerId },
    { aadhaarno: {} },
    { runValidators: true, new: true, setDefaultsOnInsert: true }
  );
  res.status(StatusCodes.OK).json({ res: "Success", data: ownerx });
});

app.post("/api/v1/verify", async (req, res) => {
  const { name } = req.body;
  if (!name) {
    throw new BadRequestError("Please provide Name");
  }
  const listRef = ref(storage);
  let ans1 = false;
  const ans = await listAll(listRef);

  for (let i = 0; i < ans.items.length; ++i) {
    if (ans.items[i]._location.path_ == name) {
      ans1 = true;
      break;
    }
  }
  res.json({ res: "Success", data: ans1 });
});

// error handler
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 8000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

//connecting to database
start();
