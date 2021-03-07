import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Alert, Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  category: number;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      const { id } = routeParams;

      const response = await api.get<Food>(`/foods/${id}`);
      setFood({
        ...response.data,
        formattedPrice: formatValue(response.data.price),
      });

      const items: Extra[] = [];

      response.data.extras.forEach(extra => {
        items.push({
          ...extra,
          quantity: 0,
        });
      });

      setExtras(items);
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    setExtras(oldExtras => {
      const newExtras = oldExtras.map(oldExtra => {
        if (oldExtra.id === id) {
          // eslint-disable-next-line no-param-reassign
          oldExtra.quantity += 1;
          return oldExtra;
        }
        return oldExtra;
      });
      return newExtras;
    });
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    setExtras(oldExtras => {
      const newExtras = oldExtras.map(oldExtra => {
        if (oldExtra.id === id) {
          if (oldExtra.quantity > 0) {
            // eslint-disable-next-line no-param-reassign
            oldExtra.quantity -= 1;
            return oldExtra;
          }
        }
        return oldExtra;
      });
      return newExtras;
    });
  }

  function handleIncrementFood(): void {
    // Increment food quantity
    setFoodQuantity(oldFoodQuantity => oldFoodQuantity + 1);
  }

  function handleDecrementFood(): void {
    // Decrement food quantity
    setFoodQuantity(oldFoodQuantity => {
      if (oldFoodQuantity === 1) {
        return oldFoodQuantity;
      }
      return oldFoodQuantity - 1;
    });
  }

  const toggleFavorite = useCallback(async () => {
    // Toggle if food is favorite or not
    if (!isFavorite) {
      const data = {
        name: food.name,
        description: food.description,
        price: food.price,
        image_url: food.image_url,
        thumbnail_url: food.image_url,
      };
      await api.post('/favorites', data);
      setIsFavorite(true);
      return;
    }
    await api.delete(`/favorites/${food.id}`);
    setIsFavorite(false);
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    let costTotal = 0.0;
    extras.forEach(extra => {
      if (extra.quantity > 0) {
        costTotal += extra.value * extra.quantity;
      }
    });
    return (food.price + costTotal) * foodQuantity;
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    await api.post('/orders', {
      product_id: food.id,
      name: food.name,
      description: food.description,
      category: food.category,
      price: cartTotal,
      thumbnail_url: food.image_url,
    });

    Alert.alert('Sucesso', 'Pedido realizado com sucesso.', undefined, {
      onDismiss: () => navigation.goBack(),
    });
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer showsVerticalScrollIndicator={false}>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">
              {formatValue(cartTotal)}
            </TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
