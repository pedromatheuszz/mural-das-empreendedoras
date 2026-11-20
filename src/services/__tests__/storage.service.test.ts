import { centerSquare } from '../storage.service';

jest.mock('expo-image-manipulator', () => ({ ImageManipulator: {}, SaveFormat: {} }));

describe('recorte automático das imagens', () => {
  it('pega o maior quadrado centralizado', () => {
    expect(centerSquare(1200, 800)).toEqual({ originX: 200, originY: 0, width: 800, height: 800 });
    expect(centerSquare(800, 1201)).toEqual({ originX: 0, originY: 200, width: 800, height: 800 });
    expect(centerSquare(500, 500)).toEqual({ originX: 0, originY: 0, width: 500, height: 500 });
  });
});
