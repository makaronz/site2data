// Zwiększ timeout dla testów
jest.setTimeout(60000);

// Wycisz logi konsolowe podczas testów
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Przywróć oryginalne funkcje console.log i console.error po testach
afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
}); 