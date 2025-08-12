/* module.exports = {
    url : "mongodb+srv://Yipeng1:123@semester3webproframe.ljmrcrf.mongodb.net/movieDB?retryWrites=true&w=majority&appName=Semester3WebProFrame"
};
 */

require('dotenv').config();

module.exports = {
    url: process.env.MONGODB_URI || "mongodb://localhost:27017/movieDB"
};