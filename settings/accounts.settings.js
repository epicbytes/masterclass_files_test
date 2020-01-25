module.exports = {
  jwtSecret:
    process.env.JWT_SECRET ||
    "f^I8Zg}VIq)H,Tu9lxAOm|)=EjP6X))$}$j6#.:?Cn%*LotF>FUlSWJVC&x{yw",
  jwtAlgorithm: process.env.JWT_ALGORYTHM || "HS256",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7 days"
};
