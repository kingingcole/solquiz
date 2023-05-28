const SolQuiz = artifacts.require("SolQuiz");

module.exports = function (deployer) {
  deployer.deploy(SolQuiz);
};
