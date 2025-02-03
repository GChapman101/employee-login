import express from 'express';
import cors from'cors';
import multer from 'multer'
import fs from 'fs'
import path from 'path';
import knex from 'knex';
import bcrypt, { compareSync } from 'bcrypt'
import e from 'express';


const app = express();
app.use(express.static('./public/Images'))
//app.use(express.static('../public/Images'))

app.use(express.json())
app.use(cors({
  origin:"http://localhost:3000",
}));
const Port = process.env.PORT ||4000;
const db = knex({
    client: 'pg',
    connection: {
      host: '127.0.0.1',
      port:5432,
      user: 'postgres',
      password: 'Techman1',
      database: 'smartbrain',
    },
  });
  
//------gets all employees-----------------------------------------
  app.get('/api/employees/',(req,res) => {
    db.select('*').from('employees')
    db('employees').orderBy('first','asc')
    .then(employees => {
        res.status(201).json(employees)
    })
   
  })
  //------------------multer setup for add employee----------------------------------------------
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/Images')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null,Date.now() + "_"+ path.extname(file.originalname));

    }
  })
  
  const upload = multer({ storage: storage })
//------------add to employee list-not used---------------------------------------------
  app.get('/api/addEmployee',upload.single(''),(req,res) => {
    const {first,email,last,phone} = req.body;
    const file = req.file.filename;
   db.transaction(trx => {
    trx.insert({
      first:first,
      last:last,
      email:email,
      phone:phone,
      image:file
    })
    .into('workers')
    .returning('workers')
    .then(worker =>{
      return res.json(worker[0])
    })
    .then(trx.commit)
   .catch(rollback)
   })
   
   //.catch(err => res.status(400).json('unable to add employee'))
   
  })
  
//--------------adds to employee list-----------------------------------------------
  app.post('/api/employee',upload.single('image'),(req,res) => {
     const {first,last,email,phone} = req.body;
     let image //req.file.filename;
     let newImage
     const {id} = req.params;
     console.log(req.body)
     
     
      if(req.file) {
        newImage = req.file.filename
      
      }else{
       newImage = '/profile.jpg'
     }
    
     db('employees').insert({
       first:first,
       last:last,
       email:email,
       phone:phone,
       image:newImage
     })
     .returning('employees')
     .where('id','=',id)
    
     
     .then(worker => {
      
     if(!worker.length) {
      
       return res.status(400).json('error adding employee')
       
     }else{
      return res.status(201).json(worker[0])
      //console.log(worker[0])
     }
      
     })
     .catch(error => res.status(401).json('internal error'))
     
    
  })
  
 
//-------------gets indidual employees-not needed-------------------------------------------
  app.get('/api/workers/:id',(req,res) => {
    const {id} = req.params;
   db.select('*').from('employees').where({id})
      .then(worker => {
        if(worker.length) {
          return res.status(201).json(worker[0])
        }else{
          return  res.status(400).json('employee not found')
        }
       return  res.status(400).json('error')
      })
   
    
  })
  //------------------api to delete indivdual employees-----------------------------------
app.delete('/api/employee/:id',(req,res) => {
  const {id} = req.params;
  
  db('employees')
  .where('id','=',id)
  .del()
  .returning('employees')
  .then(worker => {
    if(worker.length) {
      console.log(worker[0])
      return res.status(201).json(worker[0])
    }else{
      return res.status(400).json('unable to delete (no record found)')
    }
  })
  .catch(err => console.log(err))
  
})
//--------------api to update individual employees---***needed******----------------------------------------
// app.get('/api/employee/:id', async(req,res) => {
//   const {id} = req.params;
//   const {first,last,email,phone,image} = req.body;
//   //const image =req.file.filename
//    await db('employees')
//    .where('id','=',id)
//    .returning('employees')
//   //  .update({
//   //       email:email, 
//   //       phone:phone, 
//   //        first:first ,
//   //        last:last,
//   //        image:image 
//   //      }
//   //     )
//    .then(employee => {
//     console.log(employee[0])
//     return res.status(201).json({
//       title:'employee' ,
//       employee:employee[0]
//     })
//    })
   
// })


//-------------------------update for employee------------------------------------------------

app.patch('/api/employee/update/:id',upload.single('image'),async(req,res) => {
  let {id} = req.params;
  let newImage = '';
  let updatedEmployee;
  let old_image;
  let old_first = req.body.first;
  const {first,last,email,phone} = req.body;
  
  if(req.file) {
    newImage = req.file.filename;
    try{
      fs.unlinkSync('./public/Images'+ req.file.filename.old_image);
    }catch(err) {
      console.log(err)
    }
  }else{
    newImage = req.body.old_image;
  }
  
     
     await db('employees')
     .where('id','=',id)
    .returning('employees')
     .update({
     first: first!==null ?first:first,
     last:last!==null ? last:'help',
     phone:phone!==null ? phone:'help',
     email:email!==null ? email:'help',
      image:newImage 
    })
    
    
    .then(employee => {
      console.log(employee[0])
      res.status(201).json('update successful')
    })
    
})
//-------------------------might not be used---------------------------------------------------
app.put('/api/employees/',async(req,res) => {
 await db('employees')
      .where('id','=',id)
    .returning('employees')
     .update({
      first:first,
      last:last,
      email:email,
      phone:phone,
      image:newImage 
    })
    .then(employees => {
      console.log(employees)
      res.status(201).json(employees)
    })
})

app.get('/api/employee/update/:id/',async(req,res) => {
  const {id} = req.params;
    console.log(id)
    await db('employees')
    .select('*')
    .where('id','=',id)
    .returning('employees')
    .then(employees => {
        res.status(201).json(employees[0])
    })

     .catch(err => console.log(err))
       
    
        //return res.status(201).json(emplpoyees)
    

})
//---------------api to get single employee for edit details page-----------------------------
app.get('/api/employees/update/',async(req,res) => {
  db.select('*').from('employees')
  .then(employees => {
      res.status(201).json(employees)
  })
})
//------------------api to get a single employee for delete details page--------------------------------
app.get('/api/employees/delete/',async(req,res) => {
  db.select('*').from('employees')
  .then(employees => {
      res.status(201).json(employees)
  })
})
//-----------------------------------------------------------------------------------------------
app.get('/api/employees/refresh',(req,res) => {
  db.select('*').from('employees')
  
  .then(employees => {
      res.status(201).json(employees)
  })
})
//------------------------------post api to submit registration form data----------------------------
app.post('/api/employees/registration',(req,res) => {
  const {first,last,email,password} = req.body;
  console.log(req.body);
  const {id} = req.params
  console.log(req.params);
  const salt = bcrypt.genSaltSync(5);
  const hash = bcrypt.hashSync(password,salt);
  db.transaction(trx => {
    trx.insert({
      password:hash,
      email:email
    })
    .into('signin')
    .returning('email')
    .then(loginEmail =>{
      return trx('registration')
      .returning('*')
      .insert({
        first:first,
        last:last,
        email:loginEmail[0].email,
        password:hash
      })
       .then(user => {
       return res.json(user[0])
       })
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
  .catch(err => res.status(400).json('unable to register user'))
  
})

//-----------------api to signin--------------------------------------------------------------------


app.post('/api/employees/signin',(req,res) => {
  const {user,password} = req.body;
  const salt = bcrypt.genSaltSync(5);
  const hash = bcrypt.hashSync(password,salt);
  if(!password || !user) {
   return res.status(400).json('user and password can not be empty')
  }
 
  db.select('email','password')
  .from('signin')
  .where('email','=',req.body.user)
  .then(data => {
    const isValid =  bcrypt.compareSync(req.body.password,data[0].password);
    console.log(isValid)
    if(isValid) {
      return db.select('*').from('registration')
      .where('email','=',req.body.user)
      .then(user => {
        return res.json('loggin successful!')
      })
      .catch(err => res.status(400).json('unable to get user'))
    }else{
      res.status(400).json('invalid password or username')
    }
    
  })
  .catch(err => res.status(400).json('user not found'))
})

//-----------------api to send login data to be compared on front end
app.get('/api/employees/authenicate',async(req,res) => {
  
  const {password,user} = req.body
  
  db.select('email','password')
  .from('signin')
  .where('email','=',req.body.user)
  .returning('signin')
  .then(data => {
    const isValid =  bcrypt.compareSync(req.body.password,data[0].password);
    const salt = bcrypt.genSaltSync(5);
  const hash = bcrypt.hashSync(password,salt);
     if(isValid){
      console.log(isValid)
     res.status(201).json(data[0])
    }else{
      res.status(400).json('invalid password')
    }
  })
  
  .catch(err => console.log(err))
})

//------------------------api to search for employees--------------------------------------------------
app.get('/api/search/:key',async(req,res) => {
  const keys = ['first','last','email','phone'];
  const{ key} = req.params 
    
     const search = (data) => {
      return data && data.filter(item => keys.some(k => item[k].toLowerCase().includes(key)))
     }
    await db.select('*')
     .from('employees')
     db('employees').orderBy('first','asc')
     .then(data => {
      if(data) {
        return res.status(201).json(search(data))
      }else{
        return res.status(400).json('error finding search')
      }
     })
    
     .catch(err => console.log('unable to retrieve search'))
  console.log(key)
  
  
  
})
//------------------------------------------------------------
app.get('/*',function(req,res) {
  res.sendFile(
    path.join(__dirname,"../client/build/index.html"),
    function(err) {
      if(err) {
        res.status(500).send(err);
      }
    }
  )
})
//--------------sets server port and logs message-----------------------------------------------------
app.listen(Port,() => {
    console.log(`listening on port ${Port}`)
})