import { Button, Flex, Input, Select, Space, Table, Typography } from 'antd/es';
import './App.css';
import React, { useCallback, useState } from 'react';
//import { flushSync } from 'react-dom';
const { Title, Paragraph } = Typography;

//银行定存利息
const depositInterst = 0.02;
//每月社保养老部分最低要交的钱
const monthCost = 1476;
const monthEarn = 590;

const depositcolumns = [
  {
    title: '年份',
    dataIndex: 'year',
    key: 'year',
  },
  {
    title: '本金',
    dataIndex: 'raw',
    key: 'raw',
  },
  {
    title: '可获得利息',
    dataIndex: 'interest',
    key: 'interest',
  },
  {
    title: '总共',
    dataIndex: 'total',
    key: 'total',
  },
];

const retirecolumns = [
  {
    title: '年份',
    dataIndex: 'year',
    key: 'year',
  },
  {
    title: '当年增加的退休金',
    dataIndex: 'raw',
    key: 'raw',
  },
  {
    title: '可获得利息',
    dataIndex: 'interest',
    key: 'interest',
  },
  {
    title: '总共',
    dataIndex: 'total',
    key: 'total',
  },
];

const defaultAge = 45;
const defaultRetirementAge = 63;
const defaultDeadAge = 80;

function App() {
  const [formData, setFormData] = useState({
    age: defaultAge,
    retirementAge: defaultRetirementAge,
    deadAge: defaultDeadAge,
    unEmploymentMonth: 24,
  });
  const [deposits, setDeposits] = useState([]);
  const [retireEarns, setRetireEans] = useState([]);

  const handleAgeChange = (e) => {
    setFormData({
      ...formData,
      age: e.target.value,
    });
  };

  const handleRetirementAgeChange = (e) => {
    setFormData({
      ...formData,
      retirementAge: e.target.value,
    });
  };

  const handleDeadAgeChange = (e) => {
    setFormData({
      ...formData,
      deadAge: e.target.value,
    });
  };

  const handleUnEmploymentMonthChange = (value) => {
    setFormData({
      ...formData,
      unEmploymentMonth: value,
    });
  };

  const handleSubmit = () => {
    let { age, deadAge, retirementAge } = formData;
    if (deadAge < age) {
      alert('死亡年龄不能小于年龄！');
      return;
    }

    if (retirementAge < age) {
      alert('退休年龄不能小于年龄！');
      return;
    }

    if (deadAge < retirementAge) {
      alert('死亡年龄不能小于退休年龄');
      return;
    }

    reCompute(formData);
  };

  //计算两张表格的数据。
  const reCompute = (data) => {
    computeDepostit(data);
    computeEarn(data);
  };

  //以age, retirement age为基础， 计算什么时候死亡才能收回成本
  const computeDead = () => {
    let { age, retirementAge, unEmploymentMonth } = formData;
    if (retirementAge < age) {
      alert('退休年龄不能小于年龄！');
      return;
    }

    let startAge = Math.max(age, retirementAge);
    for (let i = 1; i < 99; i++) {
      let tempDeadAge = startAge + i;

      let cost = computeYearlyEarn(
        2025,
        age,
        tempDeadAge,
        retirementAge - age,
        monthCost
      );

      adjustDeposit(cost, unEmploymentMonth);

      let earns = computeYearlyEarn(
        2025 + (retirementAge - age + 1),
        retirementAge,
        tempDeadAge,
        9999,
        computeRetireIncrease({
          age,
          retirementAge,
        })
      );

      let earnTotal = Math.round(
        earns.reduce((acc, item) => acc + item.total, 0)
      );
      let costTotal = Math.round(
        cost.reduce((acc, item) => acc + item.total, 0)
      );

      if (earnTotal > costTotal) {
        alert(`您至少要活到${tempDeadAge}, 是合算的`);
        let newFormData = {
          ...formData,
          deadAge: tempDeadAge,
        };
        setFormData(newFormData);
        reCompute(newFormData);
        break;
      }
    }
  };

  const getConclusion = useCallback(() => {
    let earnTotal = Math.round(
      retireEarns.reduce((acc, item) => acc + item.total, 0)
    );
    let depositTotal = Math.round(
      deposits.reduce((acc, item) => acc + item.total, 0)
    );
    let result = `本金加利息总共是 ${depositTotal}, 增加的退休金到死亡多获得收益为 ${earnTotal}，`;
    if (earnTotal > depositTotal) {
      result += `是合算的， 可以多拿${earnTotal - depositTotal}`;
    } else {
      result += `是不合算的， 损失${depositTotal - earnTotal}`;
    }

    return result;
  }, [retireEarns, deposits]);

  const adjustDeposit = (result, unEmploymentMonth) => {
    if (unEmploymentMonth > 0 && unEmploymentMonth <=12 ) {
      if (result.length > 0) {
        result[0] = {
          ...result[0],
          raw: result[0].raw * (12 - unEmploymentMonth) / 12,
          interest: result[0].interest  * (12 - unEmploymentMonth) / 12,
          total: result[0].total *  (12 - unEmploymentMonth) / 12,
        }
      }
    }

    if (unEmploymentMonth > 12 ) {
      if (result.length > 1) {
        result[0] = {
          ...result[0],
          raw: 0,
          interest: 0,
          total: 0  
        };

        result[1] = {
          ...result[1],
          raw: result[1].raw * (24 - unEmploymentMonth) / 12,
          interest: result[1].interest  * (24 - unEmploymentMonth) / 12,
          total: result[1].total *  (24 - unEmploymentMonth) / 12,
        }
      }

      if (result.length == 1) {
        result[0] = {
          ...result[0],
          raw: 0,
          interest: 0,
          total: 0  
        };
      }
    }
  }

  const computeDepostit = (data) => {
    let { age, retirementAge, deadAge, unEmploymentMonth } = data;
    let result = computeYearlyEarn(
      2025,
      age,
      deadAge,
      retirementAge - age,
      monthCost
    );

    adjustDeposit(result, unEmploymentMonth);

    setDeposits(result);
  };

  const computeRetireIncrease = (data) => {
    let { age, retirementAge } = data;
    let earnYears = retirementAge - age + 1;
    //到退休个人帐户一共增加了多少。
    let personalAccountEarn = earnYears * monthEarn * 12;
    let retireMoney = earnYears * 100 + Math.round(personalAccountEarn / 100);

    return retireMoney;
  };

  const computeEarn = (data) => {
    let { age, retirementAge, deadAge } = data;
    //下面retireEarns到死的时候带来的收益。假设都存下来了。
    setRetireEans(
      computeYearlyEarn(
        2025 + (retirementAge - age + 1),
        retirementAge,
        deadAge,
        9999,
        computeRetireIncrease(data)
      )
    );
  };

  const computeYearlyEarn = (
    startYear,
    startAge,
    endAge,
    noCostIndex,
    monthAmount
  ) => {
    let result = [];
    let years = endAge - startAge;
    for (let i = 0; i < years; i++) {
      result.push({
        year: startYear + i,
        raw: i > noCostIndex ? 0 : monthAmount * 12,
        interest:
          i > noCostIndex
            ? 0
            : monthAmount * 12 * (1 + depositInterst) ** (years - i) -
              monthAmount * 12,
      });
    }

    result.forEach((year) => {
      year.total = year.raw + year.interest;
    });

    //  result.push({
    //   year: '总计',
    //   raw: monthAmount * 12 * years,
    //   interest: result.reduce((acc, item) => acc + item.interest, 0),
    //   total: result.reduce((acc, item) => acc + item.total, 0)
    //  });

    return result;
  };

  return (
    <div className="App">
      <h1>灵活就业社保养老金部分计算器</h1>
      <div style={{ padding: 20 }}>
        <Space direction="vertical">
          <Flex gap={16}>
            <div>
              <Typography.Title level={5}>年龄:</Typography.Title>
              <Input
                placeholder="请输入年龄"
                value={formData.age}
                onChange={handleAgeChange}
                style={{ width: 200, marginBottom: 10 }}
              />
            </div>
            <div>
              <Typography.Title level={5}>退休年龄:</Typography.Title>
              <Input
                placeholder="请输入退休年龄"
                value={formData.retirementAge}
                onChange={handleRetirementAgeChange}
                style={{ width: 200, marginBottom: 10 }}
              />
            </div>
            <div>
              <Typography.Title level={5}>死亡年龄:</Typography.Title>
              <Input
                placeholder="死亡年龄"
                value={formData.deadAge}
                onChange={handleDeadAgeChange}
                style={{ width: 200, marginBottom: 10 }}
              />
            </div>
            <div>
              <Typography.Title level={5}>申领失业金月份:</Typography.Title>
              <Select
                placeholder="请输入申领失业金月份"
                value={formData.unEmploymentMonth}
                onChange={handleUnEmploymentMonthChange}
                style={{ width: 200, marginBottom: 10 }}
              >
                {Array.from({ length: 25 }, (_, i) => 0 + i).map((item) => {
                  return (
                    <Select.Option value={item} key={item}>
                      {item}
                    </Select.Option>
                  );
                })}
              </Select>
            </div>
          </Flex>
        </Space>
        {/*
        <Select
          placeholder="请选择性别"
          value={gender}
          onChange={handleGenderChange}
          style={{ width: 200, marginBottom: 10 }}
        >
          <Select.Option value="男">男</Select.Option>
          <Select.Option value="女">女</Select.Option>
        </Select>
        */}
        <br />
        <Space>
          <Button type="primary" onClick={handleSubmit}>
            提交
          </Button>

          <Button type="primary" onClick={computeDead}>
            哪一年死亡是合算的
          </Button>
        </Space>
      </div>
      <Typography>
        <Title>提示</Title>
        <Paragraph>
          银行利息按照目前3年期定存的 2%来计算。
        </Paragraph>
        <Paragraph>
          按照上海2025年社保基数下限7384元，
          养老保险部分总共为1476.8元（20%），其中进入个人帐户的为590元。
        </Paragraph>
        <Paragraph>
          退休金的计算公式是 按照个人帐户余额每多1万，增加100退休金，
          年限多1年，增加退休金100元。
        </Paragraph>
      </Typography>

      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1, marginRight: '20px' }}>
          <h2>本金到死亡可以获得利息</h2>
          <h3>如果申领了失业金，会在前面2年内在本金里扣除</h3>
          <Table
            dataSource={deposits}
            columns={depositcolumns}
            pagination={{
              pageSize: 5,
            }}
            summary={() => {
              return (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={1}>总计</Table.Summary.Cell>
                    <Table.Summary.Cell>
                      {deposits.reduce((acc, item) => acc + item.raw, 0)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell>
                      {deposits.reduce((acc, item) => acc + item.interest, 0)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell>
                      {deposits.reduce((acc, item) => acc + item.total, 0)}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <h2>退休金增加部分到死的收益</h2>
          <h4>
            {' '}
            退休金个人帐户增加
            <b>
              {(formData.retirementAge - formData.age + 1) * monthEarn * 12}
            </b>
            元, 退休金年限增加<b>{formData.retirementAge - formData.age + 1}</b>
            年, 每月退休金增加
            <b>
              {' '}
              {computeRetireIncrease({
                age: formData.age,
                retirementAge: formData.retirementAge,
              })}
            </b>
            元
          </h4>
          <Table
            dataSource={retireEarns}
            columns={retirecolumns}
            pagination={{
              pageSize: 5,
            }}
            summary={() => {
              return (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell colSpan={1}>总计</Table.Summary.Cell>
                    <Table.Summary.Cell>
                      {retireEarns.reduce((acc, item) => acc + item.raw, 0)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell>
                      {retireEarns.reduce(
                        (acc, item) => acc + item.interest,
                        0
                      )}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell>
                      {retireEarns.reduce((acc, item) => acc + item.total, 0)}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        </div>
      </div>
      <h3>结论： {getConclusion()}</h3>
    </div>
  );
}

export default App;
