import { getInitials } from './initials';

describe('getInitials', () => {
  it('usa a primeira e a última palavra do nome', () => {
    expect(getInitials('Mariana Costa')).toBe('MC');
    expect(getInitials('Ana Paula Souza Lima')).toBe('AL');
  });

  it('usa as duas primeiras letras quando há uma palavra só', () => {
    expect(getInitials('Ana')).toBe('AN');
  });

  it('ignora espaços extras e devolve vazio sem nome', () => {
    expect(getInitials('  Mariana   Costa ')).toBe('MC');
    expect(getInitials('')).toBe('');
    expect(getInitials(undefined)).toBe('');
    expect(getInitials(null)).toBe('');
  });
});
