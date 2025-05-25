jest.mock('./checkmessage.js', () => ({
  checkMessage: jest.fn()
}));

const { checkMessage } = require('./checkmessage.js');
const { handleMessage } = require('./index.js');

let fakeMessage;

beforeEach(() => {
  jest.useFakeTimers();
  fakeMessage = {
    content: 'mon email : monemail@example.com',
    reply: jest.fn(),
    delete: jest.fn(() => Promise.resolve()),
    author: { bot: false },
  };
});

afterEach(() => {
  jest.useRealTimers();
});

test('devrait détecter un email valide', async () => {
  checkMessage.mockReturnValue('monemail@example.com');
  await handleMessage(fakeMessage);

  jest.runAllTimers();

  expect(checkMessage).toHaveBeenCalledWith(fakeMessage);
  expect(fakeMessage.reply).not.toHaveBeenCalled();
  expect(fakeMessage.delete).toHaveBeenCalled();
});

test("devrait répondre si l'email est invalide", async () => {
  checkMessage.mockReturnValue(null);
  await handleMessage(fakeMessage);

  expect(fakeMessage.reply).toHaveBeenCalledWith("❌ Email invalide.");
});
