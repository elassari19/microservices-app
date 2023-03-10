import { NextFunction, Request, Response } from 'express';
import { WithId } from 'mongodb';
import { ISignup } from './_.type';
import { Users } from '../../modules';
import crypto from 'crypto'
import { emailSender, hash } from '../../utilities';

// solve problem of underscore (_) of id
export type withid = WithId<ISignup> 

const insertUser = async (req: Request<ISignup>, res: Response, next: NextFunction) => {
  try {
    // find user by email
    const result = await Users.findOne({ email: req.body.email })

    // the user/email already exist
    if ( result?._id ) return res.status(302).send(`this user "${req.body.email}" already exist`)

    // hashing password
    req.body = { 
      email: req.body.email,
      password: hash(req.body.password),
      verification: crypto.randomBytes(64).toString('hex'),
      verified: false
    }

    // insert user/data in db
    if ( !result?._id ) {
      // @ts-ignore
      Users.create(req.body, {new: true})
        .then(async (result) => {
          await emailSender({
            to: 'hicham@omicmd.com',
            subject: 'verify your email',
            text: "please don't replay this email ",
            html: `<h1>Email Confirmation</h1>
            <div>
            <h2>Hello ${req.body.email.split('@')[0]}</h2>
            <p>Thank you for subscribing. Please confirm your email by clicking on the following link</p>
            <a href="http://${process.env.BASE_URL}/confirm?id=${req.body._id}&confirm=${req.body.verification}" >CLICK TO VIREFY EAMIL </a>
            </div>`
          })
          return res.status(201).send(result)
        })
    }

  } catch (error) {
    console.log(error)
    next(error)
  }
}

export default insertUser;
