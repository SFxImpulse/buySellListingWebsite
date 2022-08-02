/*
 * All routes for Users are defined here
 * Since this file is loaded in server.js into api/users,
 *   these routes are mounted onto /users
 * See: https://expressjs.com/en/guide/using-middleware.html#middleware.router
 */

const express = require('express');
const router  = express.Router();
const bcrypt = require('bcryptjs')


module.exports = (db) => {
  //visit login page
  router.get("/login", (req, res) => {
    if(req.session.user_id) {
      return res.redirect('/');
    }
    res.render('login', {user_id : ''})
  });
  //post login page
  router.post("/login", (req, res) => {
    const { email , password} = req.body;
    db.query('SELECT * FROM users WHERE email = $1;',[email]).then(result => {
      if (result.rows.length === 0) {
        return res.redirect('/register');
      }
      if (bcrypt.compareSync(password, result.rows[0].password)) {
        req.session.user_id = result.rows[0].id;
        return res.redirect('/');
      } else {
        res.send('Password is not correct')
      }
    }).catch(err => console.error(err));
  });

  router.get('/logout', (req,res) => {
    req.session = null;
    res.redirect('/login');
  })

  router.get('/register', (req,res) => {
    res.render('register');
  })

  router.post('/register', (req, res) => {
    const {name, email, password} = req.body;
    console.log('req.body', name, email, password);
    const text ='SELECT * FROM users WHERE email = $1';
    const params = [email];
    db.query(text, params).then(result => {
      if (result.rows.length === 0) {
        db.query('INSERT INTO users(name, email,password) VALUES($1,$2,$3)', [name, email, `${bcrypt.hashSync(password,10)}`]).then(() => {
          db.query(text, params).then(result => {
            req.session.user_id = result.rows[0].id;
            return res.redirect('/');
          })
        })
      } else {
        db.query(text,params).then(result => {
          if (result.rows[0].email === email) {
            return res.redirect('/login');
          }
        });
      }
    }).catch(err => console.error(err));
  });

  router.get('/listings', (req, res) => {
    if (req.session.user_id) {
      db.query('SELECT * FROM users WHERE id = $1;', [req.session.user_id]).then(result => {
        const templateVars = {user_id : req.session.user_id, username : result.rows[0].name}
        return res.render('listings',templateVars);
      }).catch(err => console.error(err));
    } else {
      res.redirect('/login');
    }
    db.query('SELECT * FROM listings;').then(result => {
      let listingArr = result.rows;
      console.log(listingArr);
    }).catch(err => console.error(err));
  });

  return router;

};
