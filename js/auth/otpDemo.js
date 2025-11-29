window.CGPT_OTP = (function () {
  const DEMO_PHONE = "9178332513";
  let currentOtp = null;

  function generate(phone) {
    if (phone !== DEMO_PHONE) return null;
    currentOtp = String(Math.floor(100000 + Math.random() * 900000));
    return currentOtp;
  }

  function validate(otp) {
    return otp === currentOtp;
  }

  return { generate, validate };
})();
