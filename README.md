# EECoin
1. Sieć peer-to-peer i bezpieczny portfel:
   -  Tworzenie cyfrowych tożsamości (done)
   -  Bezpieczne przechowywanie kluczy w cyfrowym portfelu (done)
   -  Uruchomienie i rejestracja węzła sieci (nawiązywanie komunikacji z innymi węzłami) (done)
5/10 p (spóźnienie)
2. Prosty łańcuch bloków:
   - Tylko 1 górnik
   - Tworzenie bloków
   - Ustalenie protokołu wymiany danych o nowych blokach
   - Implementacja weryfikacji bloków pobieranych od innych węzłów
3. Tranzakcja przekazania środków:
   - Tworzenie transakcji
   - Pierwszą transakcją w bloku powinna być transakcja coinbase tworząca nowe "monety"
   - Osiągnięcie konsesusu metodą proof-of-work
   - Walidacja transakcji pod kątem double-spending
   - Obliczanie aktualnych sald na kontach
4. Kopanie asynchroniczne
   - Wielu górników
   - Obsługa forków oraz orphan block
   - Eksperyment: jak sieć zachowa się, gdy złośliwy węzeł będzie wymuszać tworzenie forków?

(rozwazyć dodanie podkont (1 konto -> wiele podkont))