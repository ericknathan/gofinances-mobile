import React, { useState, useEffect, useCallback } from 'react';
import { ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from 'styled-components';
import { useAuth } from '../../hooks/auth';

import { HighlightCard } from '../../components/HighlightCard';
import { TransactionCard, TransactionCardProps } from '../../components/TransactionCard';

import {
  Container,
  Header,
  UserWrapper,
  UserInfo,
  Photo,
  User,
  UserGreeting,
  UserName,
  Icon,
  HighlightCards,
  Transactions,
  Title,
  TransactionList,
  LogoutButton,
  LoadContainer
} from './styles'

export interface DataListProps extends TransactionCardProps {
  id: string
}

interface HighlightProps {
  amount: string;
  lastTransaction: string;
}

interface HighlightData {
  entries: HighlightProps;
  expenses: HighlightProps;
  total: HighlightProps;
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<DataListProps[]>([]);
  const [highlightData, setHighlightData] = useState<HighlightData>({} as HighlightData);

  const theme = useTheme();
  const { user, signOut } = useAuth();

  function convertValue(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function convertDate(date: string | number) {
    return Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).format(new Date(date));
  }

  function getLastTransactionDate(
    collection: DataListProps[],
    type: 'positive' | 'negative'
  ) {
    const filteredTransaction = collection.filter(transaction => transaction.type == type);
    if(filteredTransaction.length === 0) return 0;

    const lastTransaction = new Date(Math.max.apply(Math, filteredTransaction
      .map(transaction => new Date(transaction.date).getTime())));

    return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString('pt-BR', { month: "long" })}`;
  }

  async function loadTransactions() {
    const dataKey = `@gofinances:transactions_user:${user.id}`;
    const response = await AsyncStorage.getItem(dataKey);
    const transactions = response ? JSON.parse(response) : [];

    let totalEntries = 0;
    let totalExpenses = 0;

    const formattedTransactions: DataListProps[] = transactions.map((transaction: DataListProps) => {
      if(transaction.type == 'positive') {
        totalEntries += Number(transaction.amount);
      } else {
        totalExpenses += Number(transaction.amount);
      }

      const amount = convertValue(Number(transaction.amount));

      const date = convertDate(transaction.date);

      return {
        id: transaction.id,
        name: transaction.name,
        amount,
        type: transaction.type,
        category: transaction.category,
        date,
      }
    });
    setTransactions(formattedTransactions);

    const lastTransactionEntries = getLastTransactionDate(transactions, 'positive');
    const lastTransactionExpenses = getLastTransactionDate(transactions, 'negative');
    const totalInterval = lastTransactionExpenses === 0 ? `Não há transações` : `01 a ${lastTransactionExpenses}`

    const total = totalEntries - totalExpenses;

    setHighlightData({
      entries: {
        amount: convertValue(totalEntries),
        lastTransaction: lastTransactionEntries === 0 ?
        `Não há transações` :
        `Última entrada dia ${lastTransactionEntries}`
      },
      expenses: {
        amount: convertValue(totalExpenses),
        lastTransaction: lastTransactionEntries === 0 ?
        `Não há transações` :
        `Última saída dia ${lastTransactionExpenses}`
      },
      total: {
        amount: convertValue(total),
        lastTransaction: totalInterval
      }
    });

    setIsLoading(false);
  }

  useFocusEffect(useCallback(() => {
    loadTransactions();
  }, []));
  
  return (
    <Container>
      { isLoading ?
      <LoadContainer>
        <ActivityIndicator
          color={theme.colors.primary}
          size="large"
        />
      </LoadContainer> :
      <>
        <Header>
          <UserWrapper>
            <UserInfo>
              <Photo source={{ uri: user.photo }}>

              </Photo>
              <User>
                <UserGreeting>Olá,</UserGreeting>
                <UserName>{user.name}</UserName>
              </User>
            </UserInfo>
            <LogoutButton onPress={signOut}>
              <Icon name="power" />
            </LogoutButton>
          </UserWrapper>
        </Header>

        <HighlightCards>
          <HighlightCard 
            type="up"
            title="Entradas"
            amount={highlightData.entries.amount}
            lastTransaction={highlightData.entries.lastTransaction} />
          <HighlightCard 
            type="down"
            title="Saídas"
            amount={highlightData.expenses.amount}
            lastTransaction={highlightData.expenses.lastTransaction} />
          <HighlightCard 
            type="total"
            title="Total"
            amount={highlightData.total.amount}
            lastTransaction={highlightData.total.lastTransaction} />
        </HighlightCards>

        <Transactions>
          <Title>Listagem</Title>

          <TransactionList
            data={transactions}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <TransactionCard data={item}/>}
          />
        </Transactions>
      </>
      
    }
    
    </Container>
  )
}