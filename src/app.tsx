import MainScreen from "./screens/main-screen"
import StoreProvider from "./store/store-provider"

export default function App() {
  return (
    <StoreProvider>
      <MainScreen />
    </StoreProvider>
  )
}
